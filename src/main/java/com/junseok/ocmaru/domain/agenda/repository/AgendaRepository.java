package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaRepository extends JpaRepository<Agenda, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Agenda a where a.id = :id")
  Optional<Agenda> findByIdWithWriteLock(@Param("id") Long id);

  List<Agenda> findAllByWriterId(Long writerId);
  List<Agenda> findAllByOrderByCreatedAtDesc(Pageable pageable);

  @Query(
    "select distinct a from OpinionCluster oc join oc.cluster c join c.agenda a join oc.opinion o where o.user.id = :userId order by a.createdAt desc"
  )
  List<Agenda> findAgendasWhereUserHasOpinion(
    @Param("userId") Long userId,
    Pageable pageable
  );

  long countByAgendaStatus(AgendaStatus agendaStatus);

  @Query(
    "select count(distinct a.id) from OpinionCluster oc join oc.cluster c join c.agenda a join oc.opinion o where o.user.id = :userId"
  )
  long countDistinctAgendasWhereUserHasOpinion(@Param("userId") Long userId);

  @Query("select a from Agenda a order by (a.voteCount + a.viewCount) desc")
  List<Agenda> findTopByActivity(Pageable pageable);
}
