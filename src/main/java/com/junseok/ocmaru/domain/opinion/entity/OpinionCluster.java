package com.junseok.ocmaru.domain.opinion.entity;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
  uniqueConstraints = {
    @UniqueConstraint(columnNames = { "OPINION_ID", "CLUSTER_ID" }),
  }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpinionCluster extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "CLUSTER_ID")
  private Cluster cluster;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "OPINION_ID")
  private Opinion opinion;

  public OpinionCluster(Cluster cluster, Opinion opinion) {
    this.cluster = cluster;
    this.opinion = opinion;
  }
}
