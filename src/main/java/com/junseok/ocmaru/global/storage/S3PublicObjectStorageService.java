package com.junseok.ocmaru.global.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Utilities;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * S3(또는 S3 호환 스토리지)에 객체를 올리고, 공개 URL 문자열을 반환합니다.
 * <p>
 * 객체 키는 로컬과 동일한 경로 규칙을 따릅니다: {@code public-objects/agendas/{id}/...}
 */
public class S3PublicObjectStorageService implements PublicObjectStorage {

  private final S3Client s3Client;
  private final String bucket;
  private final String region;
  /** 비어 있지 않으면 이 값 + "/" + key 로 URL을 만듭니다 (CloudFront, MinIO 공개 URL 등). */
  private final String publicBaseUrl;

  public S3PublicObjectStorageService(
    S3Client s3Client,
    String bucket,
    String region,
    String publicBaseUrl
  ) {
    this.s3Client = s3Client;
    this.bucket = bucket;
    this.region = region;
    this.publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.trim();
  }

  @Override
  public String uploadAgendaFile(Long agendaId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("No file provided");
    }

    String originalName =
      file.getOriginalFilename() == null
        ? "file"
        : Paths.get(file.getOriginalFilename()).getFileName().toString();
    String key =
      "public-objects/agendas/" +
      agendaId +
      "/" +
      System.currentTimeMillis() +
      "-" +
      originalName;

    String contentType = file.getContentType();
    if (contentType == null || contentType.isBlank()) {
      contentType = "application/octet-stream";
    }

    PutObjectRequest.Builder req =
      PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType);

    try {
      long size = file.getSize();
      if (size >= 0) {
        try (InputStream in = file.getInputStream()) {
          s3Client.putObject(req.build(), RequestBody.fromInputStream(in, size));
        }
      } else {
        s3Client.putObject(req.build(), RequestBody.fromBytes(file.getBytes()));
      }
    } catch (IOException e) {
      throw new IllegalStateException("Failed to upload file to S3", e);
    }

    return buildPublicUrl(key);
  }

  private String buildPublicUrl(String key) {
    if (!publicBaseUrl.isEmpty()) {
      String base =
        publicBaseUrl.endsWith("/")
          ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
          : publicBaseUrl;
      return base + "/" + key;
    }

    S3Utilities utils = S3Utilities.builder().region(Region.of(region)).build();
    return utils.getUrl(u -> u.bucket(bucket).key(key)).toExternalForm();
  }
}
