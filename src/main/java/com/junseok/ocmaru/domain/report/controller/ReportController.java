package com.junseok.ocmaru.domain.report.controller;

import com.junseok.ocmaru.domain.report.dto.ReportCreateRequestDto;
import com.junseok.ocmaru.domain.report.dto.ReportResponseDto;
import com.junseok.ocmaru.domain.report.dto.ReportUpdateRequestDto;
import com.junseok.ocmaru.domain.report.entity.ReportStatus;
import com.junseok.ocmaru.domain.report.service.ReportService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reports")
public class ReportController {

  private final ReportService reportService;

  @PostMapping("")
  public ResponseEntity<ReportResponseDto> createReport(
    @RequestBody @Valid ReportCreateRequestDto dto
  ) {
    ReportResponseDto report = reportService.createReport(dto);
    return ResponseEntity.status(201).body(report);
  }

  @GetMapping("")
  public ResponseEntity<List<ReportResponseDto>> getReports(
    @RequestParam(required = false) Integer limit,
    @RequestParam(required = false) Integer offset,
    @RequestParam(required = false) ReportStatus status
  ) {
    return ResponseEntity.ok(reportService.getReports(limit, offset, status));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ReportResponseDto> updateReport(
    @PathVariable("id") Long reportId,
    @RequestBody ReportUpdateRequestDto dto
  ) {
    return ResponseEntity.ok(reportService.updateReport(reportId, dto));
  }
}
