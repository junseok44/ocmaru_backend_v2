package com.junseok.ocmaru.domain.cluster.service;

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
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClusterService {

  private final ClusterRepository clusterRepository;
  private final OpinionRepository opinionRepository;
  private final OpinionClusterRepository opinionClusterRepository;

  @Transactional(readOnly = true)
  public List<ClusterResponseDto> getAllClusters(
    Integer offset,
    Integer limit
  ) {
    Pageable pageable = PageRequest.of(offset, limit);
    Page<Cluster> clusterPage = clusterRepository.findAll(pageable);

    return clusterPage
      .getContent()
      .stream()
      .map(ClusterResponseDto::from)
      .toList();
  }

  @Transactional(readOnly = true)
  public ClusterResponseDto getCluster(Long clusterId) {
    Cluster cluster = clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    return ClusterResponseDto.from(cluster);
  }

  @Transactional
  public ClusterResponseDto createCluster(ClusterCreateRequestDto dto) {
    Cluster newCluster = new Cluster(
      dto.title(),
      dto.summary(),
      dto.similarity(),
      dto.opinionIds().size()
    );

    clusterRepository.save(newCluster);

    List<Opinion> opinions = opinionRepository.findAllById(dto.opinionIds());

    try {
      for (Opinion opinion : opinions) {
        opinion.addCluster(newCluster);
      }
    } catch (Exception e) {
      throw new IllegalStateException(
        "해당 의견이 이미 클러스터에 속해있습니다."
      );
    }

    return ClusterResponseDto.from(newCluster);
  }

  // 이미 속해있는 의견이 있다면, 전체 취소하고 에러 던짐.
  @Transactional
  public ClusterResponseDto addOpinionsToCluster(
    Long clusterId,
    List<Long> opinionIds
  ) {
    Cluster cluster = clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    List<Opinion> opinions = opinionRepository.findAllById(opinionIds);

    try {
      for (Opinion opinion : opinions) {
        opinion.addCluster(cluster);
      }
    } catch (Exception e) {
      throw new IllegalStateException(
        "해당 의견이 이미 클러스터에 속해있습니다."
      );
    }

    return ClusterResponseDto.from(cluster);
  }

  // 현재는 없는 opinionIds는 그냥 무시하고 있음.
  @Transactional
  public void removeOpinionsFromCluster(Long clusterId, List<Long> opinionIds) {
    Cluster cluster = clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    List<Opinion> opinions = opinionRepository.findAllById(opinionIds);

    for (Opinion opinion : opinions) {
      opinion.removeCluster(cluster);
    }
  }

  @Transactional
  public void deleteCluster(Long clusterId) {
    Cluster cluster = clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    clusterRepository.delete(cluster);

    opinionClusterRepository.deleteAllByClusterIdIn(List.of(clusterId));
  }

  @Transactional
  public void updateCluster(Long clusterId, ClusterUpdateRequestDto dto) {
    Cluster cluster = clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    cluster.update(dto);
  }

  @Transactional(readOnly = true)
  public List<OpinionResponseDto> getOpinionsInCluster(Long clusterId) {
    clusterRepository
      .findById(clusterId)
      .orElseThrow(() ->
        new NotFoundException("해당 클러스터가 존재하지 않습니다.")
      );

    List<Opinion> opinions = opinionClusterRepository.findOpinionsWithUserByClusterId(
      clusterId
    );

    return opinions.stream().map(OpinionResponseDto::from).toList();
  }

  // TODO: 나중에 구현할 것.
  @Transactional
  public ClusterGenerateResponseDto generateCluster() {
    return new ClusterGenerateResponseDto(0, 0);
  }
}
