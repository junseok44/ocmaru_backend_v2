package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaRepository extends JpaRepository<Agenda, Long> {
  List<Agenda> findAllByWriterId(Long writerId);

  @Query(
    "select distinct a from OpinionCluster oc join oc.cluster c join c.agenda a join oc.opinion o where o.user.id = :userId order by a.createdAt desc"
  )
  List<Agenda> findAgendasWhereUserHasOpinion(
    @Param("userId") Long userId,
    Pageable pageable
  );
}
