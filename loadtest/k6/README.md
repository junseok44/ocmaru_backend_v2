# k6 부하 스크립트

## 공통

```bash
cd loadtest/k6   # 또는 프로젝트 루트에서 경로만 맞추기
k6 run write-workload.js
```

`BASE_URL`, `TEST_EMAIL` 등은 환경변수로 덮어쓸 수 있습니다.

## 다중 유저 + 보이스 (`write-workload-voice-multi.js`)

1. 서버에 `DevLoadTestUserSeedService` 기본 비밀번호: `loadtest-password!`  
   (`LOADTEST_PASSWORD`로 k6와 맞출 수 있음 — 서버는 코드 상수, k6는 env)

2. **`TEST_USER_COUNT`는 시나리오의 max VU 이상을 권장**  
   예: 최대 50 VU → `TEST_USER_COUNT=50` 이상.  
   더 적으면 `(__VU - 1) % userCount`로 같은 유저가 재사용됩니다.

3. 실행 예:

```bash
k6 run loadtest/k6/write-workload-voice-multi.js \
  -e BASE_URL=http://localhost:8080 \
  -e TEST_USER_COUNT=60 \
  -e VOICE_RATIO=0.01
```

유저 시드는 스크립트 `setup()`에서 `POST /api/dev/loadtest-users/seed?count=...` 로 자동 호출됩니다.
