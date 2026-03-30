package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.service.ClusterService;
import java.util.UUID;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(
  name = "app.cluster.job.dispatch-mode",
  havingValue = "inline",
  matchIfMissing = true
)
@RequiredArgsConstructor
public class InlineClusterJobDispatcher implements ClusterJobDispatcher {

  private final ClusterService clusterService;
  private final ClusterJobProperties clusterJobProperties;
  private final Executor clusterJobExecutor;

  @Override
  public void dispatch(UUID jobId) {
    Runnable task = () -> {
      try {
        clusterService.generateCluster(jobId);
      } catch (Exception e) {
        log.error("cluster generate failed jobId={}", jobId, e);
      }
    };
    if (clusterJobProperties.isInlineSynchronous()) {
      task.run();
    } else {
      clusterJobExecutor.execute(task);
    }
  }
}
