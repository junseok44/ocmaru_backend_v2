package com.junseok.ocmaru.domain.report.service;

import com.junseok.ocmaru.domain.report.dto.ReportCreateRequestDto;
import com.junseok.ocmaru.domain.report.dto.ReportResponseDto;
import com.junseok.ocmaru.domain.report.dto.ReportUpdateRequestDto;
import com.junseok.ocmaru.domain.report.entity.Report;
import com.junseok.ocmaru.domain.report.entity.ReportStatus;
import com.junseok.ocmaru.domain.report.repository.ReportRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

  private final ReportRepository reportRepository;
  private final UserRepository userRepository;

  @Transactional
  public ReportResponseDto createReport(ReportCreateRequestDto dto) {
    User reporter = null;
    if (dto.reporterId() != null) {
      reporter = userRepository
        .findById(dto.reporterId())
        .orElseThrow(() -> new NotFoundException("신고자를 찾을 수 없습니다."));
    }

    Report report = new Report(
      reporter,
      dto.reason(),
      dto.content(),
      dto.targetType(),
      dto.targetId()
    );
    reportRepository.save(report);
    return ReportResponseDto.from(report);
  }

  @Transactional(readOnly = true)
  public List<ReportResponseDto> getReports(
    Integer limit,
    Integer offset,
    ReportStatus status
  ) {
    int pageSize = limit != null && limit > 0 ? limit : 20;
    int pageIndex = offset != null ? offset / pageSize : 0;
    Pageable pageable = PageRequest.of(pageIndex, pageSize);

    List<Report> reports = status != null
      ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
      : reportRepository.findAllByOrderByCreatedAtDesc(pageable);

    return reports.stream().map(ReportResponseDto::from).toList();
  }

  @Transactional
  public ReportResponseDto updateReport(Long reportId, ReportUpdateRequestDto dto) {
    Report report = reportRepository
      .findById(reportId)
      .orElseThrow(() -> new NotFoundException("Report not found"));
    report.update(
      dto.reason(),
      dto.content(),
      dto.targetType(),
      dto.targetId(),
      dto.status()
    );
    return ReportResponseDto.from(report);
  }
}
