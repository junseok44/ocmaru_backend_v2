package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClusterRepository extends JpaRepository<Cluster, Long> {}
