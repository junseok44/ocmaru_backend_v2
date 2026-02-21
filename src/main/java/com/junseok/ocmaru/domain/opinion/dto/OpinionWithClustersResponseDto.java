package com.junseok.ocmaru.domain.opinion.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.junseok.ocmaru.domain.cluster.dto.ClusterResponseDto;
import java.util.List;

public record OpinionWithClustersResponseDto(
  @JsonUnwrapped OpinionResponseDto opinion,
  List<ClusterResponseDto> clusters
) {
  public static OpinionWithClustersResponseDto from(
    OpinionResponseDto opinion,
    List<ClusterResponseDto> clusters
  ) {
    return new OpinionWithClustersResponseDto(opinion, clusters);
  }
}
