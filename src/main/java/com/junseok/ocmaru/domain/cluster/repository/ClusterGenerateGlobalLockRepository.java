package com.junseok.ocmaru.domain.cluster.repository;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateGlobalLock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ClusterGenerateGlobalLockRepository
  extends JpaRepository<ClusterGenerateGlobalLock, Integer> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT l FROM ClusterGenerateGlobalLock l WHERE l.id = 1")
  Optional<ClusterGenerateGlobalLock> findSingletonForUpdate();
}
