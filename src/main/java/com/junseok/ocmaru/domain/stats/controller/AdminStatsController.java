package com.junseok.ocmaru.domain.stats.controller;

import com.junseok.ocmaru.domain.stats.dto.ActiveAgendaStatDto;
import com.junseok.ocmaru.domain.stats.dto.DashboardStatsResponseDto;
import com.junseok.ocmaru.domain.stats.dto.WeeklyOpinionStatDto;
import com.junseok.ocmaru.domain.stats.service.AdminStatsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminStatsController {

  private final AdminStatsService adminStatsService;

  @GetMapping("/stats/dashboard")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DashboardStatsResponseDto> getDashboardStats() {
    return ResponseEntity.ok(adminStatsService.getDashboardStats());
  }

  @GetMapping("/admin/stats/weekly-opinions")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<List<WeeklyOpinionStatDto>> getWeeklyOpinions() {
    return ResponseEntity.ok(adminStatsService.getWeeklyOpinions());
  }

  @GetMapping("/admin/stats/active-agendas")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<List<ActiveAgendaStatDto>> getActiveAgendas() {
    return ResponseEntity.ok(adminStatsService.getActiveAgendas());
  }
}
