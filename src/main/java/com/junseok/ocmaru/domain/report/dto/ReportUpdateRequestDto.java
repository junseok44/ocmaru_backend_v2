package com.junseok.ocmaru.domain.report.dto;

import com.junseok.ocmaru.domain.report.entity.ReportStatus;

public record ReportUpdateRequestDto(
  String reason,
  String content,
  String targetType,
  Long targetId,
  ReportStatus status
) {}
