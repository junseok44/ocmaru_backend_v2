package com.junseok.ocmaru.global.security;

import com.junseok.ocmaru.domain.cluster.job.ClusterJobProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * {@code worker} 프로필로 기동 시 내부 API 키 미설정이면 즉시 실패합니다.
 * Secret Manager / {@code CLUSTER_JOB_INTERNAL_API_KEY} 주입을 강제합니다.
 */
@Component
@Profile("worker")
@RequiredArgsConstructor
public class WorkerInternalApiKeyStartupValidator {

  private final ClusterJobProperties clusterJobProperties;

  @PostConstruct
  void validate() {
    String key = clusterJobProperties.getInternalApiKey();
    if (key == null || key.isBlank()) {
      throw new IllegalStateException(
        "worker 프로필에서는 app.cluster.job.internal-api-key (환경변수 CLUSTER_JOB_INTERNAL_API_KEY) 가 필수입니다."
      );
    }
  }
}
