package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateJobRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClusterGenerateJobStatusService {

  private static final int MAX_FAILURE_MESSAGE = 2000;

  private final ClusterGenerateJobRepository clusterGenerateJobRepository;

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void markRunning(UUID jobId) {
    ClusterGenerateJob job = clusterGenerateJobRepository
      .findById(jobId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터 생성 잡이 존재하지 않습니다.")
      );
    if (job.getStatus() != ClusterGenerateJobStatus.QUEUED) {
      return;
    }
    job.markRunning();
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void markSucceeded(
    UUID jobId,
    int clusterCreated,
    int opinionsProcessed
  ) {
    ClusterGenerateJob job = clusterGenerateJobRepository
      .findById(jobId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터 생성 잡이 존재하지 않습니다.")
      );
    job.markSucceeded(clusterCreated, opinionsProcessed);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void markFailed(UUID jobId, String message) {
    ClusterGenerateJob job = clusterGenerateJobRepository
      .findById(jobId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터 생성 잡이 존재하지 않습니다.")
      );
    String truncated = truncate(message);
    job.markFailed(truncated);
  }

  private static String truncate(String message) {
    if (message == null) {
      return null;
    }
    if (message.length() <= MAX_FAILURE_MESSAGE) {
      return message;
    }
    return message.substring(0, MAX_FAILURE_MESSAGE);
  }
}
