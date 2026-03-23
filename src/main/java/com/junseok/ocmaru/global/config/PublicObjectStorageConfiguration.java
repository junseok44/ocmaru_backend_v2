package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.storage.LocalPublicObjectStorageService;
import com.junseok.ocmaru.global.storage.PublicObjectStorage;
import com.junseok.ocmaru.global.storage.S3PublicObjectStorageService;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

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

  @Bean
  @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
  public S3Client s3Client(
    @Value("${app.storage.s3.region}") String region,
    @Value("${app.storage.s3.endpoint:}") String endpoint,
    @Value("${app.storage.s3.access-key:}") String accessKey,
    @Value("${app.storage.s3.secret-key:}") String secretKey
  ) {
    Region awsRegion = Region.of(region);
    var credentials =
      !accessKey.isBlank() && !secretKey.isBlank()
        ? StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
        : DefaultCredentialsProvider.create();

    var builder =
      S3Client.builder().region(awsRegion).credentialsProvider(credentials);

    if (!endpoint.isBlank()) {
      builder
        .endpointOverride(URI.create(endpoint))
        .serviceConfiguration(
          S3Configuration.builder().pathStyleAccessEnabled(true).build()
        );
    }

    return builder.build();
  }

  @Bean
  @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
  public PublicObjectStorage s3PublicObjectStorage(
    S3Client s3Client,
    @Value("${app.storage.s3.bucket}") String bucket,
    @Value("${app.storage.s3.region}") String region,
    @Value("${app.storage.s3.public-base-url:}") String publicBaseUrl
  ) {
    return new S3PublicObjectStorageService(s3Client, bucket, region, publicBaseUrl);
  }
}
