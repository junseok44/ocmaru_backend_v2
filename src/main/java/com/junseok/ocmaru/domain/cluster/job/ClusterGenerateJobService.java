package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateJobAcceptedDto;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ClusterGenerateJobService {

  private final ClusterJobDispatcher clusterJobDispatcher;

  public ClusterGenerateJobAcceptedDto enqueueGenerateJob() {
    UUID jobId = UUID.randomUUID();
    try {
      clusterJobDispatcher.dispatch(jobId);
    } catch (ClusterJobDispatchException e) {
      throw new ResponseStatusException(
        HttpStatus.BAD_GATEWAY,
        "클러스터 생성 워커 호출에 실패했습니다.",
        e
      );
    }
    return new ClusterGenerateJobAcceptedDto(jobId);
  }
}
