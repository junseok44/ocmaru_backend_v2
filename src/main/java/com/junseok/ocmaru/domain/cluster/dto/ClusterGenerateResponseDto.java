package com.junseok.ocmaru.domain.cluster.dto;

public record ClusterGenerateResponseDto(
  Integer clusterCreated,
  Integer opinionsProcessed
) {}
