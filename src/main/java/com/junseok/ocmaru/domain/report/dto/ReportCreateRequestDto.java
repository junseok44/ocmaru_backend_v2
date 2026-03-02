package com.junseok.ocmaru.domain.report.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportCreateRequestDto(
  Long reporterId,
  @NotBlank(message = "reason은 필수입니다.") String reason,
  String content,
  String targetType,
  Long targetId
) {}
