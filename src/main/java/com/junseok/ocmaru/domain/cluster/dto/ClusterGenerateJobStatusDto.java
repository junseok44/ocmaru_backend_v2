package com.junseok.ocmaru.domain.cluster.dto;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import java.util.UUID;

public record ClusterGenerateJobStatusDto(
  UUID jobId,
  ClusterGenerateJobStatus status,
  Integer clusterCreated,
  Integer opinionsProcessed,
  String failureMessage
) {
  public ClusterGenerateJobStatusDto(ClusterGenerateJob job) {
    this(
      job.getId(),
      job.getStatus(),
      job.getClusterCreated(),
      job.getOpinionsProcessed(),
      job.getFailureMessage()
    );
  }
}
