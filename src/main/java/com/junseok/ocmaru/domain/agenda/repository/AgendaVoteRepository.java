package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVotes;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaVoteRepository
  extends JpaRepository<AgendaVotes, Long> {
  List<AgendaVotes> findByAgendaId(Long agendaId);

  long countByAgendaIdAndVoteType(Long agendaId, AgendaVoteType voteType);

  Optional<AgendaVotes> findByAgendaIdAndUserId(Long agendaId, Long userId);

  /**
   * 파생 delete는 연관 경로 해석/flush 타이밍 이슈로 유니크 위반이 날 수 있어 명시 JPQL 사용.
   */
  @Modifying(clearAutomatically = true)
  @Query(
    "DELETE FROM AgendaVotes v WHERE v.agenda.id = :agendaId AND v.user.id = :userId"
  )
  void deleteByAgendaIdAndUserId(
    @Param("agendaId") Long agendaId,
    @Param("userId") Long userId
  );

  /** 시드/관리용: 해당 안건의 모든 투표 행 삭제 */
  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM AgendaVotes v WHERE v.agenda.id = :agendaId")
  void deleteAllByAgendaId(@Param("agendaId") Long agendaId);

  void deleteByUserId(Long userId);
}
