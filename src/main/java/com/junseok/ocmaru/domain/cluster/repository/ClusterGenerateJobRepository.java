package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ClusterGenerateJobRepository
  extends JpaRepository<ClusterGenerateJob, UUID> {
  Optional<ClusterGenerateJob> findFirstByStatusInOrderByCreatedAtAsc(
    Collection<ClusterGenerateJobStatus> statuses
  );

  Optional<ClusterGenerateJob> findByIdAndUserId(UUID id, Long userId);

  @Query(
    "SELECT j FROM ClusterGenerateJob j WHERE j.userId = :userId ORDER BY j.createdAt ASC"
  )
  List<ClusterGenerateJob> findByUserId(Long userId);
}
