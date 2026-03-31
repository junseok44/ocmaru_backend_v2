package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClusterGenerateJobRepository
  extends JpaRepository<ClusterGenerateJob, UUID> {

  Optional<ClusterGenerateJob> findFirstByStatusInOrderByCreatedAtAsc(
    Collection<ClusterGenerateJobStatus> statuses
  );

  Optional<ClusterGenerateJob> findByUserIdAndIdempotencyKey(
    Long userId,
    String idempotencyKey
  );

  Optional<ClusterGenerateJob> findByIdAndUserId(UUID id, Long userId);
}
