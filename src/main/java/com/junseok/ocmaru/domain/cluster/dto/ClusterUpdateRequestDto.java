package com.junseok.ocmaru.domain.cluster.dto;

import jakarta.validation.constraints.Size;

public record ClusterUpdateRequestDto(
  @Size(max = 200) String title,
  @Size(max = 1000) String summary
) {}
