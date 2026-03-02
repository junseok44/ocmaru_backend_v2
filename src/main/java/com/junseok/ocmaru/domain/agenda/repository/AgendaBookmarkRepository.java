package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaBookmark;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

  void deleteByUserId(Long userId);
}
