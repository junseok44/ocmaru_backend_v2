package com.junseok.ocmaru.domain.opinion.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.junseok.ocmaru.domain.cluster.dto.ClusterWithAgendaDto;
import java.util.List;

/**
 * Opinion 공통 필드 + 클러스터 목록(각 클러스터에 agenda 포함).
 */
public record OpinionWithClustersAndAgendaDto(
  @JsonUnwrapped OpinionResponseDto opinion,
  List<ClusterWithAgendaDto> clusters
) {
  public static OpinionWithClustersAndAgendaDto from(
    OpinionResponseDto opinion,
    List<ClusterWithAgendaDto> clusters
  ) {
    return new OpinionWithClustersAndAgendaDto(opinion, clusters);
  }
}
