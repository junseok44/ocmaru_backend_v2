package com.junseok.ocmaru.infra.openai.mock;

import com.junseok.ocmaru.domain.cluster.dto.ClusterMetadataDto;
import com.junseok.ocmaru.infra.openai.ClusterMetadataClient;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("mock-openai")
public class MockClusterMetadataClient implements ClusterMetadataClient {

  /** 채팅/완성 API 왕복 지연 시뮬레이션 [min, max) ms */
  private static final long NETWORK_DELAY_MIN_MS = 40;
  private static final long NETWORK_DELAY_MAX_MS = 120;

  @Override
  public ClusterMetadataDto generateMetadata(List<String> opinions) {
    sleepNetworkDelay(NETWORK_DELAY_MIN_MS, NETWORK_DELAY_MAX_MS);
    int n = opinions == null ? 0 : opinions.size();
    return new ClusterMetadataDto("mock-cluster-title", "mock summary for " + n + " opinions");
  }

  private static void sleepNetworkDelay(long minInclusiveMs, long maxExclusiveMs) {
    long ms = ThreadLocalRandom.current().nextLong(minInclusiveMs, maxExclusiveMs);
    try {
      Thread.sleep(ms);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
