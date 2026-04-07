package com.junseok.ocmaru.domain.cluster.entity;

import com.junseok.ocmaru.domain.cluster.enums.ClusterGenerateJobStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
  name = "cluster_generate_jobs",
  indexes = { @Index(name = "idx_cluster_generate_job_user", columnList = "user_id") }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClusterGenerateJob {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private ClusterGenerateJobStatus status;

  @Column(name = "cluster_created")
  private Integer clusterCreated;

  @Column(name = "opinions_processed")
  private Integer opinionsProcessed;

  @Column(name = "failure_message", length = 2000)
  private String failureMessage;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public ClusterGenerateJob(UUID id, Long userId, ClusterGenerateJobStatus status) {
    this.id = id;
    this.userId = userId;
    this.status = status;
  }

  public void markRunning() {
    this.status = ClusterGenerateJobStatus.RUNNING;
  }

  public void markSucceeded(int clusterCreated, int opinionsProcessed) {
    this.status = ClusterGenerateJobStatus.SUCCEEDED;
    this.clusterCreated = clusterCreated;
    this.opinionsProcessed = opinionsProcessed;
  }

  public void markFailed(String failureMessage) {
    this.status = ClusterGenerateJobStatus.FAILED;
    this.failureMessage = failureMessage;
  }

  @PrePersist
  void prePersist() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }
}
