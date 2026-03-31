package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateJobAcceptedDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateJobStatusDto;
import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateGlobalLockRepository;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateJobRepository;
import com.junseok.ocmaru.global.exception.ClusterGenerateBusyException;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ClusterGenerateJobService {

  private static final EnumSet<ClusterGenerateJobStatus> ACTIVE_STATUSES =
    EnumSet.of(ClusterGenerateJobStatus.QUEUED, ClusterGenerateJobStatus.RUNNING);

  private final ClusterJobDispatcher clusterJobDispatcher;
  private final ClusterGenerateGlobalLockRepository clusterGenerateGlobalLockRepository;
  private final ClusterGenerateJobRepository clusterGenerateJobRepository;
  private final ClusterGenerateJobStatusService clusterGenerateJobStatusService;

  @Transactional
  public ClusterGenerateJobAcceptedDto enqueueGenerateJob(Long userId) {
    clusterGenerateGlobalLockRepository
      .findSingletonForUpdate()
      .orElseThrow(() ->
        new IllegalStateException(
          "cluster_generate_global_lock 행이 없습니다. 애플리케이션 기동을 확인하세요."
        )
      );

    Optional<ClusterGenerateJob> activeGlobal =
      clusterGenerateJobRepository.findFirstByStatusInOrderByCreatedAtAsc(
        ACTIVE_STATUSES
      );
    if (activeGlobal.isPresent()) {
      ClusterGenerateJob active = activeGlobal.get();
      if (active.getUserId().equals(userId)) {
        return new ClusterGenerateJobAcceptedDto(active.getId());
      }
      throw new ClusterGenerateBusyException(
        "이미 다른 클러스터 생성 작업이 진행 중입니다.",
        active.getId()
      );
    }

    UUID jobId = UUID.randomUUID();
    ClusterGenerateJob row = new ClusterGenerateJob(
      jobId,
      userId,
      ClusterGenerateJobStatus.QUEUED
    );
    clusterGenerateJobRepository.save(row);

    try {
      clusterJobDispatcher.dispatch(jobId);
    } catch (ClusterJobDispatchException e) {
      clusterGenerateJobStatusService.markFailed(jobId, e.getMessage());
      throw new ResponseStatusException(
        HttpStatus.BAD_GATEWAY,
        "클러스터 생성 워커 호출에 실패했습니다.",
        e
      );
    }

    return new ClusterGenerateJobAcceptedDto(jobId);
  }

  public ClusterGenerateJobStatusDto getJobStatus(Long userId, UUID jobId) {
    ClusterGenerateJob job = clusterGenerateJobRepository
      .findByIdAndUserId(jobId, userId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터 생성 잡이 존재하지 않습니다.")
      );
    return new ClusterGenerateJobStatusDto(
      job.getId(),
      job.getStatus(),
      job.getClusterCreated(),
      job.getOpinionsProcessed(),
      job.getFailureMessage()
    );
  }
}
