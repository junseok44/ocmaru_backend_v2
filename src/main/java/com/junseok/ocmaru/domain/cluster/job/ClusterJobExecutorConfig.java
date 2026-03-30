package com.junseok.ocmaru.domain.cluster.job;

import java.util.concurrent.Executor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ClusterJobExecutorConfig {

  @Bean(name = "clusterJobExecutor")
  public Executor clusterJobExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(4);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("cluster-job-");
    executor.initialize();
    return executor;
  }
}
