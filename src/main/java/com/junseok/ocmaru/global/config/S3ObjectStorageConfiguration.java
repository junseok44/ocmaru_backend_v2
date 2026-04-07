package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.config.properties.S3StorageProperties;
import com.junseok.ocmaru.global.storage.PublicObjectStorage;
import com.junseok.ocmaru.global.storage.S3PublicObjectStorageService;
import java.net.URI;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
@EnableConfigurationProperties(S3StorageProperties.class)
public class S3ObjectStorageConfiguration {

  @Bean
  public S3Client s3Client(S3StorageProperties props) {
    Region awsRegion = Region.of(props.getRegion());
    String accessKey = props.getAccessKey();
    String secretKey = props.getSecretKey();
    var credentials =
      !accessKey.isBlank() && !secretKey.isBlank()
        ? StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
        : DefaultCredentialsProvider.create();

    var builder =
      S3Client.builder().region(awsRegion).credentialsProvider(credentials);

    String endpoint = props.getEndpoint();
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
  public PublicObjectStorage s3PublicObjectStorage(
    S3Client s3Client,
    S3StorageProperties props
  ) {
    return new S3PublicObjectStorageService(
      s3Client,
      props.getBucket(),
      props.getRegion(),
      props.getPublicBaseUrl()
    );
  }
}
