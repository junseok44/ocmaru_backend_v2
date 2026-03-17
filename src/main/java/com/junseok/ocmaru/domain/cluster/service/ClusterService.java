package com.junseok.ocmaru.domain.cluster.service;

import com.junseok.ocmaru.domain.cluster.dto.ClusterCreateRequestDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterMetadataDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterUpdateRequestDto;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.cluster.repository.ClusterRepository;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionWithEmbedding;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionClusterRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.infra.openai.OpenAiClusterMetadataClient;
import com.junseok.ocmaru.infra.openai.OpenAiEmbeddingClient;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
  private final OpenAiEmbeddingClient openAiEmbeddingClient;
  private final OpenAiClusterMetadataClient openAiClusterMetadataClient;

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

  @Transactional
  public ClusterGenerateResponseDto generateCluster() {
    // 일단 unclustered된 opinion들을 모두 조회한다.
    // 해당 opinion들의 임베딩을 openAI 임베딩 api를 활용해서 조회한다.
    // 임베딩 결과를 기반으로 클러스터링을 진행한다. 구체적으로는 첫번재 opinion부터 순회하면서,
    // 이중 for문을 돌리고, 코사인 similarity를 계산해서, 특정 threshold 이상이면 클러스터에 추가하고,
    // 그 묶음에 대해서 cluster를 생성하고, opinionCluster모델을 생성한다.
    // 구체적으로는 cluster를 생성한다음에, 그 cluster와 거기 속한 각 opinion에 대해서 opinion의 addCluster 메서드를 호출하면 될듯.

    List<Opinion> unclusteredOpinions = opinionRepository
      .findAllUnclusteredOpinions()
      .stream()
      .limit(10)
      .toList();

    List<OpinionWithEmbedding> opinionsWithEmbeddings = new ArrayList<>();
    for (Opinion opinion : unclusteredOpinions) {
      Number[] embedding = getEmbedding(opinion);
      opinionsWithEmbeddings.add(new OpinionWithEmbedding(opinion, embedding));
    }

    List<List<OpinionWithEmbedding>> clustered = new ArrayList<>();
    Set<OpinionWithEmbedding> processed = new HashSet<>();

    int opinionsProcessed = 0;

    for (int i = 0; i < opinionsWithEmbeddings.size(); i++) {
      if (processed.contains(opinionsWithEmbeddings.get(i))) {
        continue;
      }
      List<OpinionWithEmbedding> cluster = new ArrayList<>();
      cluster.add(opinionsWithEmbeddings.get(i));
      processed.add(opinionsWithEmbeddings.get(i));

      for (int j = i + 1; j < opinionsWithEmbeddings.size(); j++) {
        if (processed.contains(opinionsWithEmbeddings.get(j))) {
          continue;
        }
        double similarity = cosineSimilarity(
          opinionsWithEmbeddings.get(i).getEmbedding(),
          opinionsWithEmbeddings.get(j).getEmbedding()
        );

        if (similarity > 0.5) {
          cluster.add(opinionsWithEmbeddings.get(j));
          processed.add(opinionsWithEmbeddings.get(j));
        }
      }

      if (cluster.size() >= 2) {
        clustered.add(cluster);
        opinionsProcessed += cluster.size();
      }
    }

    for (List<OpinionWithEmbedding> cluster : clustered) {
      ClusterMetadataDto clusterMetadata = generateClusterMetadata(cluster);

      double averageSimilarity = calculateAverageSimilarity(cluster);

      Cluster newCluster = new Cluster(
        clusterMetadata.title(),
        clusterMetadata.summary(),
        (int) (averageSimilarity * 100),
        cluster.size()
      );

      clusterRepository.save(newCluster);

      for (OpinionWithEmbedding opinionWithEmbedding : cluster) {
        opinionWithEmbedding.getOpinion().addCluster(newCluster);
      }
    }

    return new ClusterGenerateResponseDto(clustered.size(), opinionsProcessed);
  }

  public Number[] getEmbedding(Opinion opinion) {
    return openAiEmbeddingClient.getEmbedding(opinion.getContent());
  }

  private static double cosineSimilarity(
    Number[] embedding1,
    Number[] embedding2
  ) {
    double dotProduct = 0;
    double norm1 = 0;
    double norm2 = 0;
    for (int i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i].doubleValue() * embedding2[i].doubleValue();
      norm1 += embedding1[i].doubleValue() * embedding1[i].doubleValue();
      norm2 += embedding2[i].doubleValue() * embedding2[i].doubleValue();
    }
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private ClusterMetadataDto generateClusterMetadata(
    List<OpinionWithEmbedding> cluster
  ) {
    List<String> contents = cluster
      .stream()
      .map(opinionWithEmbedding ->
        opinionWithEmbedding.getOpinion().getContent()
      )
      .toList();

    return openAiClusterMetadataClient.generateMetadata(contents);
  }

  private static double calculateAverageSimilarity(
    List<OpinionWithEmbedding> cluster
  ) {
    double sum = 0;
    for (int i = 1; i < cluster.size(); i++) {
      sum +=
        cosineSimilarity(
          cluster.get(0).getEmbedding(),
          cluster.get(i).getEmbedding()
        );
    }
    return sum / Math.max(1, cluster.size() - 1);
  }
}
