package com.junseok.ocmaru.domain.cluster.job;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateJobAcceptedDto;
import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateGlobalLock;
import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateJob;
import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateGlobalLockRepository;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateJobRepository;
import com.junseok.ocmaru.global.exception.ClusterGenerateBusyException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ClusterGenerateJobServiceTest {

  @Mock
  private ClusterJobDispatcher clusterJobDispatcher;

  @Mock
  private ClusterGenerateGlobalLockRepository clusterGenerateGlobalLockRepository;

  @Mock
  private ClusterGenerateJobRepository clusterGenerateJobRepository;

  @Mock
  private ClusterGenerateJobStatusService clusterGenerateJobStatusService;

  @InjectMocks
  private ClusterGenerateJobService clusterGenerateJobService;

  @BeforeEach
  void lockReady() {
    when(clusterGenerateGlobalLockRepository.findSingletonForUpdate())
      .thenReturn(Optional.of(new ClusterGenerateGlobalLock(1)));
    when(clusterGenerateJobRepository.findFirstByStatusInOrderByCreatedAtAsc(any()))
      .thenReturn(Optional.empty());
  }

  @Test
  @DisplayName("enqueueGenerateJob는 job 행을 저장한 뒤 디스패처를 호출한다")
  void enqueueGenerateJob_savesAndDispatches() {
    ArgumentCaptor<ClusterGenerateJob> rowCaptor = ArgumentCaptor.forClass(
      ClusterGenerateJob.class
    );

    ClusterGenerateJobAcceptedDto dto =
      clusterGenerateJobService.enqueueGenerateJob(1L);

    assertThat(dto.jobId()).isNotNull();
    verify(clusterGenerateJobRepository).save(rowCaptor.capture());
    assertThat(rowCaptor.getValue().getUserId()).isEqualTo(1L);
    assertThat(rowCaptor.getValue().getStatus()).isEqualTo(
      ClusterGenerateJobStatus.QUEUED
    );
    verify(clusterJobDispatcher).dispatch(dto.jobId());
  }

  @Test
  @DisplayName("디스패처가 실패하면 잡을 실패 처리하고 502를 던진다")
  void enqueueGenerateJob_dispatchFailure_marksFailed() {
    when(clusterGenerateJobRepository.save(any(ClusterGenerateJob.class)))
      .thenAnswer(invocation -> invocation.getArgument(0));

    org.mockito.Mockito
      .doThrow(new ClusterJobDispatchException("x", new RuntimeException()))
      .when(clusterJobDispatcher)
      .dispatch(any(UUID.class));

    assertThatThrownBy(() -> clusterGenerateJobService.enqueueGenerateJob(1L))
      .isInstanceOf(ResponseStatusException.class)
      .satisfies(ex -> {
        ResponseStatusException r = (ResponseStatusException) ex;
        assertThat(r.getStatusCode().value()).isEqualTo(502);
      });

    verify(clusterGenerateJobStatusService).markFailed(any(UUID.class), any());
  }

  @Test
  @DisplayName("시스템에 진행 중인 잡이 있고 요청자가 같으면 같은 jobId만 반환한다")
  void enqueueGenerateJob_globalActiveSameUser_returnsExisting() {
    UUID activeId = UUID.fromString(
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    );
    ClusterGenerateJob active = new ClusterGenerateJob(
      activeId,
      1L,
      ClusterGenerateJobStatus.RUNNING
    );
    when(clusterGenerateJobRepository.findFirstByStatusInOrderByCreatedAtAsc(any()))
      .thenReturn(Optional.of(active));

    ClusterGenerateJobAcceptedDto dto =
      clusterGenerateJobService.enqueueGenerateJob(1L);

    assertThat(dto.jobId()).isEqualTo(activeId);
    verify(clusterGenerateJobRepository, never()).save(any());
    verify(clusterJobDispatcher, never()).dispatch(any(UUID.class));
  }

  @Test
  @DisplayName("시스템에 진행 중인 잡이 다른 사용자 것이면 409 예외를 던진다")
  void enqueueGenerateJob_globalActiveOtherUser_conflict() {
    UUID activeId = UUID.fromString(
      "cccccccc-cccc-cccc-cccc-cccccccccccc"
    );
    ClusterGenerateJob active = new ClusterGenerateJob(
      activeId,
      2L,
      ClusterGenerateJobStatus.RUNNING
    );
    when(clusterGenerateJobRepository.findFirstByStatusInOrderByCreatedAtAsc(any()))
      .thenReturn(Optional.of(active));

    assertThatThrownBy(() -> clusterGenerateJobService.enqueueGenerateJob(1L))
      .isInstanceOf(ClusterGenerateBusyException.class)
      .satisfies(ex -> {
        ClusterGenerateBusyException c = (ClusterGenerateBusyException) ex;
        assertThat(c.getActiveJobId()).isEqualTo(activeId);
      });

    verify(clusterGenerateJobRepository, never()).save(any());
    verify(clusterJobDispatcher, never()).dispatch(any(UUID.class));
  }
}
