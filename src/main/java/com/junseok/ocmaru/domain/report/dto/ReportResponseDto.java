package com.junseok.ocmaru.domain.report.dto;

import com.junseok.ocmaru.domain.report.entity.Report;
import com.junseok.ocmaru.domain.report.entity.ReportStatus;
import java.time.LocalDateTime;

public record ReportResponseDto(
  Long id,
  Long reporterId,
  String reason,
  String content,
  String targetType,
  Long targetId,
  ReportStatus status,
  LocalDateTime createdAt
) {
  public static ReportResponseDto from(Report report) {
    return new ReportResponseDto(
      report.getId(),
      report.getReporter() != null ? report.getReporter().getId() : null,
      report.getReason(),
      report.getContent(),
      report.getTargetType(),
      report.getTargetId(),
      report.getStatus(),
      report.getCreatedAt()
    );
  }
}
