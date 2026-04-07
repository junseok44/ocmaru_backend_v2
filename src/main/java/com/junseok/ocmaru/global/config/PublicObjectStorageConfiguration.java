package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.storage.LocalPublicObjectStorageService;
import com.junseok.ocmaru.global.storage.PublicObjectStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PublicObjectStorageConfiguration {

  @Bean
  @ConditionalOnProperty(
    name = "app.storage.type",
    havingValue = "local",
    matchIfMissing = true
  )
  public PublicObjectStorage localPublicObjectStorage(
    @Value("${app.storage.public-dir:public-objects}") String publicDir
  ) {
    return new LocalPublicObjectStorageService(publicDir);
  }
}
