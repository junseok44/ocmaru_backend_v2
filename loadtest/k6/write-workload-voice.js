import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

/** /api/opinions/transcribe POST 시도 횟수 (테스트 요약 CUSTOM 섹션에 표시) */
const transcribeCalls = new Counter("transcribe_calls");
/** transcribe 응답 200 횟수 */
const transcribeSuccess = new Counter("transcribe_success");

export const options = {
  scenarios: {
    write_voice_workload: {
      executor: "ramping-vus",
      stages: [
        { duration: "10s", target: 20 },
        { duration: "20s", target: 50 },
        { duration: "10s", target: 10 },
      ],
      gracefulStop: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<4000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const TEST_EMAIL = __ENV.TEST_EMAIL || "dev@example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "password";
const TEST_USERNAME = __ENV.TEST_USERNAME || "dev";

const VOTE_TYPE = __ENV.VOTE_TYPE || "AGREEMENT";

const VOICE_RATIO = __ENV.VOICE_RATIO ? parseFloat(__ENV.VOICE_RATIO) : 0; // 기본 0: 보이스 호출(Whisper) 비용 방지

// 보이스 호출을 켜려면 오디오 파일이 필요합니다.
// 기본 경로: loadtest/k6/audio/sample.webm
let audioFile = null;
if (VOICE_RATIO > 0) {
  const audioBin = open("./audio/sample.m4a", "b");
  audioFile = http.file(audioBin, "sample.m4a", "audio/m4a");
}

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function setup() {
  let loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (loginRes.status !== 200) {
    http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: { "Content-Type": "application/json" } },
    );

    loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const accessToken = loginRes.json().accessToken;
  check(loginRes, { "login 200": (r) => r.status === 200 });
  if (!accessToken) {
    throw new Error(
      `Login failed: status=${loginRes.status}, body=${loginRes.body}`,
    );
  }

  // dev용 agendas 샘플 생성
  const seedRes = http.post(`${BASE_URL}/api/dev/agendas/seed`, null, {
    headers: authHeaders(accessToken),
  });
  check(seedRes, {
    "seed status 200/201/204/401": (r) =>
      r.status === 200 ||
      r.status === 201 ||
      r.status === 204 ||
      r.status === 401,
  });

  const agendasRes = http.get(`${BASE_URL}/api/agendas?offset=0&limit=20`);
  check(agendasRes, { "get agendas 200": (r) => r.status === 200 });

  const agendas = agendasRes.json();
  if (!Array.isArray(agendas)) {
    throw new Error(
      `Unexpected /api/agendas response (expected array). status=${agendasRes.status}, body=${agendasRes.body}`,
    );
  }
  const agendaIds = agendas.map((a) => a.id).filter((id) => id != null);
  if (agendaIds.length === 0) {
    throw new Error("No agendas found. Seed endpoint or DB data issue.");
  }

  if (VOICE_RATIO > 0 && !audioFile) {
    throw new Error(
      "VOICE_RATIO > 0 but audio file not found. Put audio at loadtest/k6/audio/sample.webm",
    );
  }

  return { accessToken, agendaIds };
}

export default function (data) {
  const jsonHeaders = authHeaders(data.accessToken);

  const agendaId = pick(data.agendaIds);
  if (!agendaId) return;

  let content = `load-${__VU}-${__ITER}-${Date.now()}`;

  // 1) 일부 요청만 Whisper 호출 후 content로 사용
  if (VOICE_RATIO > 0 && Math.random() < VOICE_RATIO) {
    const trRes = http.post(
      `${BASE_URL}/api/opinions/transcribe`,
      { audio: audioFile },
      {
        // multipart/form-data는 k6이 자동으로 셋업
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      },
    );

    transcribeCalls.add(1);
    check(trRes, { "transcribe 200": (r) => r.status === 200 });
    if (trRes.status === 200) {
      transcribeSuccess.add(1);
      content = trRes.json().text || content;
    }
  }

  // 2) 의견 생성 (TEXT로 저장, 서버 구현상 voiceUrl/type은 create에서 무시될 수 있음)
  const opinionRes = http.post(
    `${BASE_URL}/api/agendas/${agendaId}/opinions`,
    JSON.stringify({ type: "TEXT", content }),
    { headers: jsonHeaders },
  );
  check(opinionRes, {
    "create opinion 201/200": (r) => r.status === 201 || r.status === 200,
  });

  const opinionJson = opinionRes.json();
  const opinionId = opinionJson.id;
  if (!opinionId) return;

  // 3) 투표
  const voteRes = http.post(
    `${BASE_URL}/api/agendas/votes`,
    JSON.stringify({ agendaId, voteType: VOTE_TYPE }),
    { headers: jsonHeaders },
  );
  check(voteRes, {
    "create vote 201/200": (r) => r.status === 201 || r.status === 200,
  });

  // 4) 좋아요
  const likeRes = http.post(
    `${BASE_URL}/api/opinions/${opinionId}/like`,
    null,
    { headers: jsonHeaders },
  );
  check(likeRes, {
    "like 204/200": (r) => r.status === 204 || r.status === 200,
  });

  sleep(0.2);
}
