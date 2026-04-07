package com.junseok.ocmaru.global.config;

import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ClusterEmbeddingConfig {

  @Bean(name = "clusterEmbeddingExecutor")
  public Executor clusterEmbeddingExecutor(
    @Value("${app.cluster.embedding.parallelism:8}") int parallelism
  ) {
    int pool = Math.max(1, parallelism);
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(pool);
    executor.setMaxPoolSize(pool);
    executor.setQueueCapacity(Integer.MAX_VALUE);
    executor.setThreadNamePrefix("cluster-embedding-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(60);
    executor.initialize();
    return executor;
  }
}
