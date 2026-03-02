package com.junseok.ocmaru.domain.report.repository;

import com.junseok.ocmaru.domain.report.entity.Report;
import com.junseok.ocmaru.domain.report.entity.ReportStatus;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
  List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

  List<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

  long countByStatus(ReportStatus status);

  void deleteByReporterId(Long reporterId);
}
