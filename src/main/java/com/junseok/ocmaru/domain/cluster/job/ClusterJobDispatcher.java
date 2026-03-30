package com.junseok.ocmaru.domain.cluster.job;

import java.util.UUID;

public interface ClusterJobDispatcher {

  void dispatch(UUID jobId);
}
