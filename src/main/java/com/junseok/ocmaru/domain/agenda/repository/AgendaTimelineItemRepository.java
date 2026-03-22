package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.AgendaTimelineItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaTimelineItemRepository
  extends JpaRepository<AgendaTimelineItem, Long> {
  @Query(
    "select t from AgendaTimelineItem t where t.agenda.id = :agendaId order by t.createdAt asc"
  )
  List<AgendaTimelineItem> findByAgendaIdOrderByCreatedAtAsc(
    @Param("agendaId") Long agendaId
  );

  /** 안건 삭제 전 FK 정리 — 벌크 삭제로 flush 순서 이슈 방지 */
  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM AgendaTimelineItem t WHERE t.agenda.id = :agendaId")
  void deleteAllByAgendaId(@Param("agendaId") Long agendaId);

  void deleteByUserId(Long userId);
}
