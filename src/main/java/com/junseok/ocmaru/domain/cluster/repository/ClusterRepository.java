package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClusterRepository extends JpaRepository<Cluster, Long> {
  List<Cluster> findByAgendaId(Long agendaId);

  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM Cluster c WHERE c.agenda.id = :agendaId")
  void deleteAllByAgendaId(@Param("agendaId") Long agendaId);

  List<Cluster> findTop5ByOrderByCreatedAtDesc();
}
