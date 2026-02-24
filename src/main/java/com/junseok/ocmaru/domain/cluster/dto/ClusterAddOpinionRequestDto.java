package com.junseok.ocmaru.domain.cluster.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ClusterAddOpinionRequestDto(@NotNull List<Long> opinionIds) {}
