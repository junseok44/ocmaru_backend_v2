package com.junseok.ocmaru.domain.stats.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardStatsResponseDto(
  PeriodStats today,
  PeriodStats week,
  long activeAgendas,
  long pendingReports,
  List<RecentClusterDto> recentClusters
) {
  public record PeriodStats(long newOpinions, long newUsers) {}

  public record RecentClusterDto(
    Long id,
    String title,
    String summary,
    Integer opinionCount,
    Integer similarity,
    LocalDateTime createdAt
  ) {}
}
