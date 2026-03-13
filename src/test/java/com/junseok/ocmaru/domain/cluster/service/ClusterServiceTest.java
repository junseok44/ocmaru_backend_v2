package com.junseok.ocmaru.domain.cluster.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.junseok.ocmaru.domain.cluster.dto.ClusterCreateRequestDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterUpdateRequestDto;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.cluster.repository.ClusterRepository;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionClusterRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.stream.LongStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ClusterServiceTest {

  @Mock
  private ClusterRepository clusterRepository;

  @Mock
  private OpinionRepository opinionRepository;

  @Mock
  private OpinionClusterRepository opinionClusterRepository;

  @InjectMocks
  private ClusterService clusterService;

  @Test
  @DisplayName("대량 opinion으로 createCluster 호출 시 하나의 cluster로 묶인다")
  void createCluster_groupsBulkOpinions() {
    // given
    List<Long> opinionIds = LongStream.rangeClosed(1, 200).boxed().toList();
    List<Opinion> opinions = opinionIds.stream().map(this::newOpinion).toList();

    ClusterCreateRequestDto dto = new ClusterCreateRequestDto(
      "생활 불편 의견 묶음",
      "유사한 주민 의견 묶음",
      90,
      opinionIds
    );

    when(opinionRepository.findAllById(opinionIds)).thenReturn(opinions);
    when(clusterRepository.save(any(Cluster.class)))
      .thenAnswer(invocation -> invocation.getArgument(0));

    // when
    ClusterResponseDto response = clusterService.createCluster(dto);

    // then
    assertThat(response.title()).isEqualTo("생활 불편 의견 묶음");
    assertThat(opinions)
      .allSatisfy(opinion -> assertThat(opinion.getClusters()).hasSize(1));
    verify(clusterRepository).save(any(Cluster.class));
    verify(opinionRepository).findAllById(opinionIds);
  }

  @Test
  @DisplayName(
    "addOpinionsToCluster 호출 시 opinion들이 기존 cluster에 추가된다"
  )
  void addOpinionsToCluster_addsOpinions() {
    // given
    Cluster cluster = new Cluster("기존 클러스터", "요약", 80, 0);
    ReflectionTestUtils.setField(cluster, "id", 10L);

    List<Long> opinionIds = LongStream.rangeClosed(1, 50).boxed().toList();
    List<Opinion> opinions = opinionIds.stream().map(this::newOpinion).toList();

    when(clusterRepository.findById(10L)).thenReturn(Optional.of(cluster));
    when(opinionRepository.findAllById(opinionIds)).thenReturn(opinions);

    // when
    ClusterResponseDto response = clusterService.addOpinionsToCluster(
      10L,
      opinionIds
    );

    // then
    assertThat(response.id()).isEqualTo(10L);
    assertThat(opinions)
      .allSatisfy(opinion -> assertThat(opinion.getClusters()).hasSize(1));
  }

  @Test
  @DisplayName(
    "removeOpinionsFromCluster 호출 시 지정 opinion만 cluster에서 제거된다"
  )
  void removeOpinionsFromCluster_removesOnlyRequestedOpinions() {
    // given
    Cluster targetCluster = new Cluster("타겟", "요약", 70, 0);
    ReflectionTestUtils.setField(targetCluster, "id", 1L);
    Cluster otherCluster = new Cluster("다른 클러스터", "요약", 60, 0);
    ReflectionTestUtils.setField(otherCluster, "id", 2L);

    Opinion opinion1 = newOpinion(1L);
    Opinion opinion2 = newOpinion(2L);

    opinion1.addCluster(targetCluster);
    opinion1.addCluster(otherCluster);
    opinion2.addCluster(targetCluster);

    when(clusterRepository.findById(1L)).thenReturn(Optional.of(targetCluster));
    when(opinionRepository.findAllById(List.of(1L, 2L)))
      .thenReturn(List.of(opinion1, opinion2));

    // when
    clusterService.removeOpinionsFromCluster(1L, List.of(1L, 2L));

    // then
    assertThat(opinion1.getClusters()).hasSize(1);
    assertThat(opinion1.getClusters().get(0).getId()).isEqualTo(2L);
    assertThat(opinion2.getClusters()).isEmpty();
  }

  @Test
  @DisplayName("getOpinionsInCluster는 opinion 목록을 DTO로 반환한다")
  void getOpinionsInCluster_returnsDtos() {
    // given
    Cluster cluster = new Cluster("클러스터", "요약", 55, 0);
    ReflectionTestUtils.setField(cluster, "id", 5L);

    Opinion opinion1 = newOpinion(101L);
    Opinion opinion2 = newOpinion(102L);

    when(clusterRepository.findById(5L)).thenReturn(Optional.of(cluster));
    when(opinionClusterRepository.findOpinionsWithUserByClusterId(5L))
      .thenReturn(List.of(opinion1, opinion2));

    // when
    List<OpinionResponseDto> result = clusterService.getOpinionsInCluster(5L);

    // then
    assertThat(result).hasSize(2);
    assertThat(result)
      .extracting(OpinionResponseDto::id)
      .containsExactly(101L, 102L);
  }

  @Test
  @DisplayName("updateCluster는 title/summary를 갱신한다")
  void updateCluster_updatesFields() {
    // given
    Cluster cluster = new Cluster("기존 제목", "기존 요약", 88, 10);
    ReflectionTestUtils.setField(cluster, "id", 3L);

    when(clusterRepository.findById(3L)).thenReturn(Optional.of(cluster));

    // when
    clusterService.updateCluster(
      3L,
      new ClusterUpdateRequestDto("새 제목", "새 요약")
    );

    // then
    assertThat(cluster.getTitle()).isEqualTo("새 제목");
    assertThat(cluster.getSummary()).isEqualTo("새 요약");
  }

  @Test
  @DisplayName("deleteCluster는 cluster와 연결 opinionCluster를 함께 정리한다")
  void deleteCluster_deletesClusterAndRelations() {
    // given
    Cluster cluster = new Cluster("삭제 대상", "요약", 77, 8);
    ReflectionTestUtils.setField(cluster, "id", 9L);
    when(clusterRepository.findById(9L)).thenReturn(Optional.of(cluster));

    // when
    clusterService.deleteCluster(9L);

    // then
    verify(clusterRepository).delete(cluster);
    verify(opinionClusterRepository).deleteAllByClusterIdIn(eq(List.of(9L)));
  }

  @Test
  @DisplayName("존재하지 않는 cluster 조회 시 NotFoundException을 던진다")
  void getCluster_notFound() {
    when(clusterRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> clusterService.getCluster(999L))
      .isInstanceOf(NotFoundException.class)
      .hasMessageContaining("해당 클러스터가 존재하지 않습니다");
  }

  @Test
  @DisplayName("generateCluster는 현재 placeholder 응답(0,0)을 반환한다")
  void generateCluster_returnsPlaceholder() {
    ClusterGenerateResponseDto response = clusterService.generateCluster();

    assertThat(response.clusterCreated()).isEqualTo(0);
    assertThat(response.opinionsProcessed()).isEqualTo(0);
  }

  private Opinion newOpinion(Long opinionId) {
    User user = new User(
      "user" + opinionId + "@test.com",
      "pw",
      "user" + opinionId
    );
    ReflectionTestUtils.setField(user, "id", opinionId + 10000);

    Opinion opinion = new Opinion(user, "의견-" + opinionId);
    ReflectionTestUtils.setField(opinion, "id", opinionId);
    return opinion;
  }
}
