package com.junseok.ocmaru.domain.cluster.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ClusterWorkerGenerateRequestDto(@NotNull UUID jobId) {}
