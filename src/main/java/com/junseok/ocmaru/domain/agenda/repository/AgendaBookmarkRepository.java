package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaBookmark;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaBookmarkRepository
  extends JpaRepository<AgendaBookmark, Long> {
  Optional<AgendaBookmark> findByAgendaIdAndUserId(Long agendaId, Long userId);

  boolean existsByAgendaIdAndUserId(Long agendaId, Long userId);

  void deleteByAgendaIdAndUserId(Long agendaId, Long userId);

  @Query(
    "select a from Agenda a join AgendaBookmark ab on ab.agenda = a where ab.user.id = :userId order by a.createdAt desc"
  )
  List<Agenda> findBookmarkedAgendasByUserId(
    @Param("userId") Long userId,
    Pageable pageable
  );

  long countByUserId(Long userId);

  @Query("select count(ab) from AgendaBookmark ab where ab.agenda.id = :agendaId")
  long countByAgendaId(@Param("agendaId") Long agendaId);

  void deleteByUserId(Long userId);

  /** 해당 안건의 북마크 전부 삭제 (안건 삭제 전 FK 정리용, 벌크 삭제) */
  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM AgendaBookmark b WHERE b.agenda.id = :agendaId")
  void deleteAllByAgendaId(@Param("agendaId") Long agendaId);
}
