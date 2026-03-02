package com.junseok.ocmaru.domain.report.entity;

import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "REPORTER_ID")
  private User reporter;

  @Column(nullable = false, length = 200)
  private String reason;

  @Column(length = 1000)
  private String content;

  @Column(length = 30)
  private String targetType;

  private Long targetId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ReportStatus status = ReportStatus.PENDING;

  public Report(
    User reporter,
    String reason,
    String content,
    String targetType,
    Long targetId
  ) {
    this.reporter = reporter;
    this.reason = reason;
    this.content = content;
    this.targetType = targetType;
    this.targetId = targetId;
  }

  public void update(
    String reason,
    String content,
    String targetType,
    Long targetId,
    ReportStatus status
  ) {
    if (reason != null) this.reason = reason;
    if (content != null) this.content = content;
    if (targetType != null) this.targetType = targetType;
    if (targetId != null) this.targetId = targetId;
    if (status != null) this.status = status;
  }
}
