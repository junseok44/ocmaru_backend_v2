package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.dto.ClusterWorkerGenerateRequestDto;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@ConditionalOnProperty(
  name = "app.cluster.job.dispatch-mode",
  havingValue = "http"
)
@RequiredArgsConstructor
public class HttpClusterJobDispatcher implements ClusterJobDispatcher {

  private final RestTemplate restTemplate;
  private final ClusterJobProperties clusterJobProperties;

  @Override
  public void dispatch(UUID jobId) {
    String base = clusterJobProperties.getWorkerUrl().trim();
    if (base.isEmpty()) {
      throw new IllegalStateException(
        "app.cluster.job.worker-url is required when dispatch-mode=http"
      );
    }
    if (base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }
    String url = base + "/api/internal/worker/cluster/generate";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    String key = clusterJobProperties.getInternalApiKey();
    if (key != null && !key.isBlank()) {
      headers.set("X-Internal-Api-Key", key);
    }

    HttpEntity<ClusterWorkerGenerateRequestDto> entity = new HttpEntity<>(
      new ClusterWorkerGenerateRequestDto(jobId),
      headers
    );

    try {
      restTemplate.postForEntity(url, entity, String.class);
    } catch (RestClientException e) {
      throw new ClusterJobDispatchException(
        "cluster worker HTTP dispatch failed: " + url,
        e
      );
    }
  }
}
