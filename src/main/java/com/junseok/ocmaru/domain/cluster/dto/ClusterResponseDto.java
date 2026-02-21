package com.junseok.ocmaru.domain.cluster.dto;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;

public record ClusterResponseDto(Long id, String title, String summary) {
  public static ClusterResponseDto from(Cluster cluster) {
    return new ClusterResponseDto(
      cluster.getId(),
      cluster.getTitle(),
      cluster.getSummary()
    );
  }
}
