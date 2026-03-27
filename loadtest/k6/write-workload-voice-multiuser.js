import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

/**
 * 다중 유저 부하 (유저 풀 + VU별 토큰)
 *
 * 사전 조건:
 * 1) 서버에서 POST /api/dev/loadtest-users/seed 로 유저 풀 생성 (이 스크립트 setup에서 호출)
 * 2) TEST_USER_COUNT는 시나리오 max VU 이상 권장 (같은 유저를 여러 VU가 쓰면 투표 등이 직렬/경합됨)
 *
 * 환경변수:
 * - BASE_URL
 * - TEST_USER_COUNT: 생성·로그인할 유저 수 (기본 60)
 * - LOADTEST_PASSWORD: DevLoadTestUserSeedService 기본값과 동일 (기본 loadtest-password!)
 * - VOICE_RATIO, VOTE_TYPE 등은 write-workload-voice.js 와 동일
 */

const transcribeCalls = new Counter("transcribe_calls");
const transcribeSuccess = new Counter("transcribe_success");

export const options = {
  scenarios: {
    write_voice_multi: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 500 }, // 2분 동안 천천히 500명까지 증가
        { duration: "3m", target: 500 }, // 500명에서 3분간 유지 (스테이징)
        { duration: "2m", target: 1000 }, // 다시 1000명까지 증가
        { duration: "3m", target: 1000 }, // 1000명에서 유지
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<4000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

/** max VU(예: 50) 이상이면 유저가 VU마다 분산됨 */
const TEST_USER_COUNT = __ENV.TEST_USER_COUNT
  ? parseInt(__ENV.TEST_USER_COUNT, 10)
  : 60;

const LOADTEST_PASSWORD = __ENV.LOADTEST_PASSWORD || "loadtest-password!";

const VOTE_TYPE = __ENV.VOTE_TYPE || "AGREEMENT";
const VOICE_RATIO = __ENV.VOICE_RATIO ? parseFloat(__ENV.VOICE_RATIO) : 0;

const EMAIL_PREFIX = "loadtest-";
const EMAIL_DOMAIN = "@loadtest.local";

function loadtestEmail(indexOneBased) {
  return `${EMAIL_PREFIX}${indexOneBased}${EMAIL_DOMAIN}`;
}

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
  if (TEST_USER_COUNT < 1 || Number.isNaN(TEST_USER_COUNT)) {
    throw new Error("TEST_USER_COUNT must be a positive integer");
  }

  // 1) 유저 풀 시딩 (이미 있으면 서버에서 skip)
  const seedUsersRes = http.post(
    `${BASE_URL}/api/dev/loadtest-users/seed?count=${TEST_USER_COUNT}`,
    null,
  );
  check(seedUsersRes, {
    "seed loadtest users 200": (r) => r.status === 200,
  });
  if (seedUsersRes.status !== 200) {
    throw new Error(
      `seed loadtest users failed: ${seedUsersRes.status} ${seedUsersRes.body}`,
    );
  }

  // 2) 유저별 로그인 → accessToken 배열 (인덱스 0 = loadtest-1)
  const tokens = [];
  for (let i = 1; i <= TEST_USER_COUNT; i++) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: loadtestEmail(i),
        password: LOADTEST_PASSWORD,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
    const ok = check(loginRes, {
      "login loadtest user 200": (r) => r.status === 200,
    });
    const accessToken = loginRes.json().accessToken;
    if (!ok || !accessToken) {
      throw new Error(
        `Login failed for ${loadtestEmail(i)}: status=${loginRes.status} body=${loginRes.body}`,
      );
    }
    tokens.push(accessToken);
  }

  const firstToken = tokens[0];

  // 3) 안건 시드 (Bearer: 풀의 첫 유저)
  const seedRes = http.post(`${BASE_URL}/api/dev/agendas/seed`, null, {
    headers: authHeaders(firstToken),
  });
  check(seedRes, {
    "seed agendas 200/201/204/401": (r) =>
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
      `Unexpected /api/agendas response. status=${agendasRes.status}`,
    );
  }
  const agendaIds = agendas.map((a) => a.id).filter((id) => id != null);
  if (agendaIds.length === 0) {
    throw new Error("No agendas found after seed.");
  }

  if (VOICE_RATIO > 0 && !audioFile) {
    throw new Error(
      "VOICE_RATIO > 0 but audio file missing. Use loadtest/k6/audio/sample.m4a",
    );
  }

  return { tokens, agendaIds, userCount: TEST_USER_COUNT };
}

export default function (data) {
  // VU 1 → index 0 → loadtest-1@...
  const idx = (__VU - 1) % data.userCount;
  const accessToken = data.tokens[idx];
  const jsonHeaders = authHeaders(accessToken);

  const agendaId = pick(data.agendaIds);
  if (!agendaId) return;

  let content = `load-${__VU}-${__ITER}-${Date.now()}`;

  // 1) 일부 요청만 음성 입력 사용.
  if (VOICE_RATIO > 0 && Math.random() < VOICE_RATIO) {
    const trRes = http.post(
      `${BASE_URL}/api/opinions/transcribe`,
      { audio: audioFile },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

  // 2) 랜덤 선택한 agenda에 대한 의견 생성 (TEXT)
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

  // 3) 랜덤 선택한 agenda에 대한 투표
  const voteRes = http.post(
    `${BASE_URL}/api/agendas/votes`,
    JSON.stringify({ agendaId, voteType: VOTE_TYPE }),
    { headers: jsonHeaders },
  );
  check(voteRes, {
    "create vote 201/200": (r) => r.status === 201 || r.status === 200,
  });

  // 4)
  const likeRes = http.post(
    `${BASE_URL}/api/opinions/${opinionId}/like`,
    null,
    { headers: jsonHeaders },
  );
  check(likeRes, {
    "like 204/200": (r) => r.status === 204 || r.status === 200,
  });

  sleep(1);
}
