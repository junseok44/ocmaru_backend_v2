import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    write_workload: {
      executor: "ramping-vus",
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 20 },
        { duration: "10s", target: 10 },
      ],
      gracefulStop: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const TEST_EMAIL = __ENV.TEST_EMAIL || "dev@example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "password";
const TEST_USERNAME = __ENV.TEST_USERNAME || "dev";

const VOTE_TYPE = __ENV.VOTE_TYPE || "AGREEMENT";

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
  // 1) 로그인
  let loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (loginRes.status !== 200) {
    // 계정 없을 가능성 대응: register 후 재시도
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

  check(loginRes, { "login 200": (r) => r.status === 200 });
  const loginJson = loginRes.json();
  const accessToken = loginJson.accessToken;

  if (!accessToken) {
    // 로그인 실패 시 k6이 조용히 진행하지 않도록 중단
    throw new Error(
      `Login failed: status=${loginRes.status}, body=${loginRes.body}`,
    );
  }

  // 2) dev용 agendas 샘플 생성
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

  // 3) 안건 id 확보
  const agendasRes = http.get(`${BASE_URL}/api/agendas?offset=0&limit=20`);
  check(agendasRes, { "get agendas 200": (r) => r.status === 200 });

  const agendas = agendasRes.json();
  const agendaIds = agendas.map((a) => a.id).filter((id) => id != null);
  if (agendaIds.length === 0) {
    throw new Error("No agendas found. Seed endpoint or DB data issue.");
  }

  return { accessToken, agendaIds };
}

export default function (data) {
  const headers = authHeaders(data.accessToken);

  const agendaId = pick(data.agendaIds);
  if (!agendaId) return;

  // 1) 의견 생성 (TEXT)
  const content = `load-${__VU}-${__ITER}-${Date.now()}`;
  const opinionRes = http.post(
    `${BASE_URL}/api/agendas/${agendaId}/opinions`,
    JSON.stringify({ type: "TEXT", content }),
    { headers },
  );
  check(opinionRes, {
    "create opinion 201/200": (r) => r.status === 201 || r.status === 200,
  });

  const opinionJson = opinionRes.json();
  const opinionId = opinionJson.id;
  if (!opinionId) return;

  // 2) 투표
  const voteRes = http.post(
    `${BASE_URL}/api/agendas/votes`,
    JSON.stringify({ agendaId, voteType: VOTE_TYPE }),
    { headers },
  );
  check(voteRes, {
    "create vote 201/200": (r) => r.status === 201 || r.status === 200,
  });

  // 3) 좋아요
  const likeRes = http.post(
    `${BASE_URL}/api/opinions/${opinionId}/like`,
    null,
    { headers },
  );
  check(likeRes, {
    "like 204/200": (r) => r.status === 204 || r.status === 200,
  });

  sleep(0.2);
}
