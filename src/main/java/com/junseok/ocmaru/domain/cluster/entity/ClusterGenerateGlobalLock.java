package com.junseok.ocmaru.domain.cluster.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시스템 전역 클러스터 생성 동시성 제어용 단일 행(비관적 락).
 */
@Entity
@Table(name = "cluster_generate_global_lock")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClusterGenerateGlobalLock {

  public static final int SINGLETON_ID = 1;

  @Id
  private Integer id = SINGLETON_ID;

  public ClusterGenerateGlobalLock(Integer id) {
    this.id = id;
  }
}
