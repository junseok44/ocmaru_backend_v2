package com.junseok.ocmaru.domain.agenda.service;

import com.junseok.ocmaru.global.exception.ConflictException;
import java.time.Duration;
import java.util.Collections;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 동일 (agendaId, userId) 투표 생성/변경/삭제 요청을 직렬화하기 위한 Redis 분산 락.
 * 트랜잭션 메서드 안에서만 호출하고, 커밋/롤백 후 {@link TransactionSynchronization#afterCompletion} 에서 해제한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisVoteLockService {

  static final String LOCK_PREFIX = "lock:vote:";

  private static final DefaultRedisScript<Long> UNLOCK_SCRIPT = new DefaultRedisScript<>(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    Long.class
  );

  private final StringRedisTemplate stringRedisTemplate;

  @Value("${app.agenda.vote-lock.enabled:true}")
  private boolean lockEnabled;

  @Value("${app.agenda.vote-lock.wait-timeout-ms:5000}")
  private long waitTimeoutMs;

  /** 락 보유 TTL. 트랜잭션이 이 안에 끝나도록 서버 설정을 맞추는 것이 안전하다. */
  @Value("${app.agenda.vote-lock.ttl-ms:2000}")
  private long ttlMs;

  @Value("${app.agenda.vote-lock.retry-interval-ms:50}")
  private long retryIntervalMs;

  /**
   * 락을 획득하고, 현재 트랜잭션이 끝나면 해제하도록 등록한다.
   *
   * @throws ConflictException 대기 시간 내 락을 얻지 못한 경우
   * @throws IllegalStateException 활성 트랜잭션이 없을 때
   */
  public void acquireAndRegisterRelease(long agendaId, long userId) {
    if (!lockEnabled) {
      return;
    }
    if (!TransactionSynchronizationManager.isSynchronizationActive()) {
      throw new IllegalStateException(
        "RedisVoteLockService.acquireAndRegisterRelease 는 @Transactional 경계 안에서만 호출해야 합니다."
      );
    }

    String key = lockKey(agendaId, userId);
    String token = UUID.randomUUID().toString();
    acquireWithWait(key, token);
    TransactionSynchronizationManager.registerSynchronization(
      new TransactionSynchronization() {
        @Override
        public void afterCompletion(int status) {
          releaseLock(key, token);
        }
      }
    );
  }

  private void acquireWithWait(String key, String token) {
    long deadline = System.currentTimeMillis() + waitTimeoutMs;
    while (true) {
      Boolean ok = stringRedisTemplate
        .opsForValue()
        .setIfAbsent(key, token, Duration.ofMillis(ttlMs));

      if (Boolean.TRUE.equals(ok)) {
        return;
      }
      if (System.currentTimeMillis() > deadline) {
        throw new ConflictException(
          "동일 안건에 대한 투표 처리가 진행 중입니다. 잠시 후 다시 시도해 주세요."
        );
      }
      try {
        Thread.sleep(retryIntervalMs);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new ConflictException("투표 락 대기가 중단되었습니다.");
      }
    }
  }

  private void releaseLock(String key, String token) {
    try {
      stringRedisTemplate.execute(
        UNLOCK_SCRIPT,
        Collections.singletonList(key),
        token
      );
    } catch (Exception e) {
      log.warn("Redis 투표 락 해제 실패 key={}", key, e);
    }
  }

  static String lockKey(long agendaId, long userId) {
    return LOCK_PREFIX + agendaId + ":" + userId;
  }
}
