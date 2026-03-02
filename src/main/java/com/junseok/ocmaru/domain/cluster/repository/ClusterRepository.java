package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClusterRepository extends JpaRepository<Cluster, Long> {
  List<Cluster> findByAgendaId(Long agendaId);

  List<Cluster> findTop5ByOrderByCreatedAtDesc();
}
