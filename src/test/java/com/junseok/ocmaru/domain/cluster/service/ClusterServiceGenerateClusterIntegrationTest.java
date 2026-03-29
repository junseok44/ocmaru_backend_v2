package com.junseok.ocmaru.domain.cluster.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateResponseDto;
import com.junseok.ocmaru.domain.cluster.metrics.ClusterGenerateMetrics;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.AuthProvider;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.RepetitionInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles({ "test", "mock-openai" })
@Transactional
class ClusterServiceGenerateClusterIntegrationTest {

  @Autowired
  private ClusterService clusterService;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private OpinionRepository opinionRepository;

  @Autowired
  private MeterRegistry meterRegistry;

  @RepeatedTest(3)
  @DisplayName("generateCluster 성능측정(mock-openai, rollback)")
  void generateCluster_measuresDuration_withRollback(RepetitionInfo info) {
    User user = userRepository.save(
      new User("loadtest@example.com", "prov", AuthProvider.LOCAL, "loadtester")
    );

    for (int i = 0; i < 7000; i++) {
      opinionRepository.save(new Opinion(user, "integration-opinion-" + i));
    }

    long wallStartNanos = System.nanoTime();
    ClusterGenerateResponseDto response = clusterService.generateCluster();
    long wallNanos = System.nanoTime() - wallStartNanos;

    assertThat(response).isNotNull();
    assertThat(response.clusterCreated()).isGreaterThanOrEqualTo(0);
    assertThat(response.opinionsProcessed()).isGreaterThanOrEqualTo(0);

    long rep = info.getCurrentRepetition();
    assertThat(
      meterRegistry.get(ClusterGenerateMetrics.EMBEDDING).timer().count()
    )
      .isEqualTo(rep);
    assertThat(
      meterRegistry.get(ClusterGenerateMetrics.CLUSTERING).timer().count()
    )
      .isEqualTo(rep);
    assertThat(
      meterRegistry.get(ClusterGenerateMetrics.METADATA).timer().count()
    )
      .isEqualTo(rep);

    Timer embeddingTimer = meterRegistry
      .get(ClusterGenerateMetrics.EMBEDDING)
      .timer();
    assertThat(embeddingTimer.totalTime(TimeUnit.NANOSECONDS)).isPositive();
    assertThat(wallNanos).isPositive();

    System.out.printf(
      "[generateCluster] wallTimeMs=%.3f embeddingMeanMs=%.3f clusteringMeanMs=%.3f metadataMeanMs=%.3f%n",
      wallNanos / 1_000_000.0,
      embeddingTimer.mean(TimeUnit.MILLISECONDS),
      meterRegistry
        .get(ClusterGenerateMetrics.CLUSTERING)
        .timer()
        .mean(TimeUnit.MILLISECONDS),
      meterRegistry
        .get(ClusterGenerateMetrics.METADATA)
        .timer()
        .mean(TimeUnit.MILLISECONDS)
    );
  }
}
