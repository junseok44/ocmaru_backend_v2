import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    read_workload: {
      executor: "ramping-vus",
      stages: [
        { duration: "10s", target: 30 },
        { duration: "10s", target: 50 },
        { duration: "10s", target: 0 },
      ],
      gracefulStop: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function setup() {
  const res = http.get(`${BASE_URL}/api/agendas?offset=0&limit=20`);
  check(res, { "seed agendas list status 200": (r) => r.status === 200 });

  const agendas = res.json();
  if (!Array.isArray(agendas)) {
    throw new Error(
      `Unexpected /api/agendas response (expected array). status=${res.status}, body=${res.body}`,
    );
  }

  const ids = agendas.map((a) => a.id).filter((id) => id != null);
  return { agendaIds: ids };
}

export default function (data) {
  // 1) 목록 조회
  const listRes = http.get(`${BASE_URL}/api/agendas?offset=0&limit=10`, {
    tags: { name: "GET /agendas" },
  });
  check(listRes, { "GET /agendas 200": (r) => r.status === 200 });

  // 2) 상세/연관 의견 (가능할 때만)
  const agendaId = pick(data.agendaIds);
  if (agendaId) {
    const detailRes = http.get(`${BASE_URL}/api/agendas/${agendaId}`, {
      tags: { name: "GET /agendas/{id}" },
    });
    check(detailRes, { "GET /agendas/{id} 200": (r) => r.status === 200 });

    const opinionsRes = http.get(
      `${BASE_URL}/api/agendas/${agendaId}/opinions`,
      { tags: { name: "GET /agendas/{id}/opinions" } },
    );
    check(opinionsRes, {
      "GET /agendas/{id}/opinions 200": (r) => r.status === 200,
    });
  }

  // 3) 전체 의견 검색 (인증 없음)
  const opinionsSearchRes = http.get(
    `${BASE_URL}/api/opinions?offset=0&limit=10`,
    { tags: { name: "GET /opinions" } },
  );
  check(opinionsSearchRes, { "GET /opinions 200": (r) => r.status === 200 });

  sleep(0.2);
}
