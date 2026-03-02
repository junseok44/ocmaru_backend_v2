package com.junseok.ocmaru.domain.stats.service;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.cluster.repository.ClusterRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.report.entity.ReportStatus;
import com.junseok.ocmaru.domain.report.repository.ReportRepository;
import com.junseok.ocmaru.domain.stats.dto.ActiveAgendaStatDto;
import com.junseok.ocmaru.domain.stats.dto.DashboardStatsResponseDto;
import com.junseok.ocmaru.domain.stats.dto.WeeklyOpinionStatDto;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

  private final OpinionRepository opinionRepository;
  private final UserRepository userRepository;
  private final AgendaRepository agendaRepository;
  private final ReportRepository reportRepository;
  private final ClusterRepository clusterRepository;
  private final OpinionCommentRepository opinionCommentRepository;

  @Transactional(readOnly = true)
  public DashboardStatsResponseDto getDashboardStats() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
    LocalDateTime weekStart = now.minusDays(7);

    long todayOpinions = opinionRepository.countByCreatedAtGreaterThanEqual(todayStart);
    long weekOpinions = opinionRepository.countByCreatedAtGreaterThanEqual(weekStart);
    long todayUsers = userRepository.countByCreatedAtGreaterThanEqual(todayStart);
    long weekUsers = userRepository.countByCreatedAtGreaterThanEqual(weekStart);
    long activeAgendas = agendaRepository.countByAgendaStatus(AgendaStatus.VOTING);
    long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

    List<DashboardStatsResponseDto.RecentClusterDto> recentClusters = clusterRepository
      .findTop5ByOrderByCreatedAtDesc()
      .stream()
      .map(c ->
        new DashboardStatsResponseDto.RecentClusterDto(
          c.getId(),
          c.getTitle(),
          c.getSummary(),
          c.getOpinionCount(),
          c.getSimilarity(),
          c.getCreatedAt()
        )
      )
      .toList();

    return new DashboardStatsResponseDto(
      new DashboardStatsResponseDto.PeriodStats(todayOpinions, todayUsers),
      new DashboardStatsResponseDto.PeriodStats(weekOpinions, weekUsers),
      activeAgendas,
      pendingReports,
      recentClusters
    );
  }

  @Transactional(readOnly = true)
  public List<WeeklyOpinionStatDto> getWeeklyOpinions() {
    LocalDate today = LocalDate.now();
    String[] dayNames = { "월", "화", "수", "목", "금", "토", "일" };

    List<WeeklyOpinionStatDto> result = new ArrayList<>();
    for (int i = 6; i >= 0; i--) {
      LocalDate day = today.minusDays(i);
      LocalDateTime dayStart = day.atStartOfDay();
      LocalDateTime dayEnd = day.plusDays(1).atStartOfDay();
      long count = opinionRepository.countByCreatedAtBetween(dayStart, dayEnd);

      int dayIndex = day.getDayOfWeek().getValue() - 1;
      result.add(new WeeklyOpinionStatDto(day, dayNames[dayIndex], count, i == 0));
    }

    return result;
  }

  @Transactional(readOnly = true)
  public List<ActiveAgendaStatDto> getActiveAgendas() {
    List<Agenda> agendas = agendaRepository.findTopByActivity(PageRequest.of(0, 20));

    List<ActiveAgendaStatDto> withScore = agendas
      .stream()
      .map(agenda -> {
        long commentCount = opinionCommentRepository.countByAgendaId(agenda.getId());
        long activityScore =
          agenda.getVoteCount() + agenda.getViewCount() + commentCount;
        return new ActiveAgendaStatDto(
          agenda.getId(),
          agenda.getTitle(),
          agenda.getDescription(),
          agenda.getAgendaStatus().name(),
          agenda.getVoteCount(),
          agenda.getViewCount(),
          commentCount,
          activityScore
        );
      })
      .sorted(Comparator.comparingLong(ActiveAgendaStatDto::activityScore).reversed())
      .toList();

    return withScore;
  }
}
