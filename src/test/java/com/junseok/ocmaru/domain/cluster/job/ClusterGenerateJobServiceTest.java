package com.junseok.ocmaru.domain.cluster.job;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateJobAcceptedDto;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ClusterGenerateJobServiceTest {

  @Mock
  private ClusterJobDispatcher clusterJobDispatcher;

  @InjectMocks
  private ClusterGenerateJobService clusterGenerateJobService;

  @Test
  @DisplayName("enqueueGenerateJob는 jobId를 발급하고 디스패처를 호출한다")
  void enqueueGenerateJob_dispatchesWithJobId() {
    ClusterGenerateJobAcceptedDto dto =
      clusterGenerateJobService.enqueueGenerateJob();

    assertThat(dto.jobId()).isNotNull();
    verify(clusterJobDispatcher).dispatch(dto.jobId());
  }

  @Test
  @DisplayName("디스패처가 ClusterJobDispatchException을 던지면 502로 변환한다")
  void enqueueGenerateJob_mapsDispatchFailure() {
    doThrow(
      new ClusterJobDispatchException("x", new RuntimeException("cause"))
    )
      .when(clusterJobDispatcher)
      .dispatch(any(UUID.class));

    assertThatThrownBy(() -> clusterGenerateJobService.enqueueGenerateJob())
      .isInstanceOf(ResponseStatusException.class)
      .satisfies(ex -> {
        ResponseStatusException r = (ResponseStatusException) ex;
        assertThat(r.getStatusCode().value()).isEqualTo(502);
      });
  }
}
