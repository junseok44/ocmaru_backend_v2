package com.junseok.ocmaru.global.config.properties;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * {@code app.storage.type=s3} 일 때만 등록·바인딩된다 ({@link com.junseok.ocmaru.global.config.S3ObjectStorageConfiguration}).
 */
@ConfigurationProperties(prefix = "app.storage.s3")
@Validated
public class S3StorageProperties {

  @NotBlank
  private String bucket;

  @NotBlank
  private String region;

  private String endpoint = "";
  private String accessKey = "";
  private String secretKey = "";
  private String publicBaseUrl = "";

  public String getBucket() {
    return bucket;
  }

  public void setBucket(String bucket) {
    this.bucket = bucket;
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region;
  }

  public String getEndpoint() {
    return endpoint;
  }

  public void setEndpoint(String endpoint) {
    this.endpoint = endpoint != null ? endpoint : "";
  }

  public String getAccessKey() {
    return accessKey;
  }

  public void setAccessKey(String accessKey) {
    this.accessKey = accessKey != null ? accessKey : "";
  }

  public String getSecretKey() {
    return secretKey;
  }

  public void setSecretKey(String secretKey) {
    this.secretKey = secretKey != null ? secretKey : "";
  }

  public String getPublicBaseUrl() {
    return publicBaseUrl;
  }

  public void setPublicBaseUrl(String publicBaseUrl) {
    this.publicBaseUrl = publicBaseUrl != null ? publicBaseUrl : "";
  }
}
