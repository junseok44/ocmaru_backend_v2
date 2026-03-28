package com.junseok.ocmaru.infra.openai.mock;

import com.junseok.ocmaru.infra.openai.EmbeddingClient;
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("mock-openai")
public class MockEmbeddingClient implements EmbeddingClient {

  private static final int DIM = 256;
  /** 임베딩 API 왕복 지연 시뮬레이션 [min, max) ms */
  private static final long NETWORK_DELAY_MIN_MS = 5;
  private static final long NETWORK_DELAY_MAX_MS = 35;

  @Override
  public Number[] getEmbedding(String input) {
    sleepNetworkDelay(NETWORK_DELAY_MIN_MS, NETWORK_DELAY_MAX_MS);
    double[] v = new double[DIM];
    int seed = input == null ? 0 : input.hashCode();
    for (int i = 0; i < DIM; i++) {
      v[i] = ((seed + i * 31) % 1000) / 1000.0;
    }
    double norm = Math.sqrt(Arrays.stream(v).map(x -> x * x).sum());
    if (norm > 0) {
      for (int i = 0; i < DIM; i++) {
        v[i] /= norm;
      }
    }
    Number[] out = new Number[DIM];
    for (int i = 0; i < DIM; i++) {
      out[i] = v[i];
    }
    return out;
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
