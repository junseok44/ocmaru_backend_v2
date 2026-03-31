package com.junseok.ocmaru.domain.cluster.job;

import com.junseok.ocmaru.domain.cluster.entity.ClusterGenerateGlobalLock;
import com.junseok.ocmaru.domain.cluster.repository.ClusterGenerateGlobalLockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClusterGenerateGlobalLockInitializer implements ApplicationRunner {

  private final ClusterGenerateGlobalLockRepository clusterGenerateGlobalLockRepository;

  @Override
  public void run(ApplicationArguments args) {
    if (clusterGenerateGlobalLockRepository.count() == 0) {
      clusterGenerateGlobalLockRepository.save(
        new ClusterGenerateGlobalLock(ClusterGenerateGlobalLock.SINGLETON_ID)
      );
    }
  }
}
