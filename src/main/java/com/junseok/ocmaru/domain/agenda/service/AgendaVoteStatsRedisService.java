package com.junseok.ocmaru.domain.agenda.service;

import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteStatResponseDto;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.repository.AgendaVoteRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * 안건 투표 수(찬/반/중립)를 Redis 해시에 원자적으로 갱신한다.
 * 키가 없거나 Redis 오류 시 {@link AgendaVoteRepository} 로 재계산·폴백한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgendaVoteStatsRedisService {

  static final String KEY_PREFIX = "agenda:votes:";

  private final StringRedisTemplate stringRedisTemplate;
  private final AgendaVoteRepository agendaVoteRepository;

  private static String key(Long agendaId) {
    return KEY_PREFIX + agendaId;
  }

  /** 목록/상세: Redis 합계 우선, 실패 시 DB 컬럼값 폴백 */
  public int getDisplayVoteCount(long agendaId, int dbFallbackTotal) {
    try {
      ensureHashOrRebuild(agendaId);
      Map<Object, Object> raw = stringRedisTemplate.opsForHash().entries(key(agendaId));
      if (raw.isEmpty()) {
        return dbFallbackTotal;
      }
      long sum = 0L;
      for (AgendaVoteType t : AgendaVoteType.values()) {
        sum += parseCount(raw.get(t.name()));
      }
      return (int) Math.min(Integer.MAX_VALUE, sum);
    } catch (Exception e) {
      log.debug("Redis 투표 수 조회 실패, DB 폴백 agendaId={}", agendaId, e);
      return dbFallbackTotal;
    }
  }

  /** 투표 API 응답용 통계 */
  public AgendaVoteStatResponseDto getStats(long agendaId) {
    try {
      ensureHashOrRebuild(agendaId);
      Map<Object, Object> raw = stringRedisTemplate.opsForHash().entries(key(agendaId));
      if (raw.isEmpty()) {
        return countFromDatabase(agendaId);
      }
      int agree = (int) parseCount(raw.get(AgendaVoteType.AGREEMENT.name()));
      int disagree = (int) parseCount(raw.get(AgendaVoteType.DISAGREEMENT.name()));
      int neutral = (int) parseCount(raw.get(AgendaVoteType.NEUTRAL.name()));
      int total = agree + disagree + neutral;
      return new AgendaVoteStatResponseDto(total, agree, disagree, neutral);
    } catch (Exception e) {
      log.warn("Redis 투표 통계 조회 실패, DB 재계산 agendaId={}", agendaId, e);
      return countFromDatabase(agendaId);
    }
  }

  /**
   * DB 저장 후 호출. 이전 행이 없으면 신규 표만 +1, 있으면 유형 변경 시 이동, 동일 유형 재저장은 변화 없음.
   */
  public void afterVoteSaved(
    long agendaId,
    Optional<AgendaVoteType> previousType,
    AgendaVoteType newType
  ) {
    try {
      ensureHashOrRebuild(agendaId);
      if (previousType.isEmpty()) {
        stringRedisTemplate.opsForHash().increment(key(agendaId), newType.name(), 1L);
      } else if (previousType.get() != newType) {
        stringRedisTemplate.opsForHash().increment(key(agendaId), previousType.get().name(), -1L);
        stringRedisTemplate.opsForHash().increment(key(agendaId), newType.name(), 1L);
      }
    } catch (Exception e) {
      log.warn("Redis 투표 집계 갱신 실패, 캐시 무효화 agendaId={}", agendaId, e);
      invalidateQuietly(agendaId);
    }
  }

  public void afterVoteRemoved(long agendaId, AgendaVoteType removedType) {
    try {
      ensureHashOrRebuild(agendaId);
      stringRedisTemplate.opsForHash().increment(key(agendaId), removedType.name(), -1L);
    } catch (Exception e) {
      log.warn("Redis 투표 집계 갱신 실패, 캐시 무효화 agendaId={}", agendaId, e);
      invalidateQuietly(agendaId);
    }
  }

  void rebuildFromDatabase(long agendaId) {
    AgendaVoteStatResponseDto dto = countFromDatabase(agendaId);
    Map<String, String> map = new HashMap<>();
    map.put(AgendaVoteType.AGREEMENT.name(), Integer.toString(dto.agree()));
    map.put(AgendaVoteType.DISAGREEMENT.name(), Integer.toString(dto.disagree()));
    map.put(AgendaVoteType.NEUTRAL.name(), Integer.toString(dto.neutral()));
    stringRedisTemplate.opsForHash().putAll(key(agendaId), map);
  }

  private void ensureHashOrRebuild(long agendaId) {
    if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(key(agendaId)))) {
      return;
    }
    rebuildFromDatabase(agendaId);
  }

  private void invalidateQuietly(long agendaId) {
    try {
      stringRedisTemplate.delete(key(agendaId));
    } catch (Exception e) {
      log.debug("Redis 키 삭제 실패 agendaId={}", agendaId, e);
    }
  }

  private AgendaVoteStatResponseDto countFromDatabase(long agendaId) {
    long agree = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.AGREEMENT
    );
    long disagree = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.DISAGREEMENT
    );
    long neutral = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.NEUTRAL
    );
    int a = (int) agree;
    int d = (int) disagree;
    int n = (int) neutral;
    return new AgendaVoteStatResponseDto(a + d + n, a, d, n);
  }

  private static long parseCount(Object v) {
    if (v == null) {
      return 0L;
    }
    try {
      return Long.parseLong(v.toString());
    } catch (NumberFormatException e) {
      return 0L;
    }
  }
}
