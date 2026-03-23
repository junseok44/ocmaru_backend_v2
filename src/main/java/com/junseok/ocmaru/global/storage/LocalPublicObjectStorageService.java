package com.junseok.ocmaru.global.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.multipart.MultipartFile;

/** 로컬 {@code app.storage.public-dir} 아래에 파일을 저장합니다. */
public class LocalPublicObjectStorageService implements PublicObjectStorage {

  private final Path publicRootDir;

  public LocalPublicObjectStorageService(String publicDir) {
    this.publicRootDir = Paths.get(publicDir).toAbsolutePath().normalize();
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
    String relativePath =
      "agendas/" +
      agendaId +
      "/" +
      System.currentTimeMillis() +
      "-" +
      originalName;
    Path target = publicRootDir.resolve(relativePath).normalize();

    try {
      Files.createDirectories(target.getParent());
      try (InputStream in = file.getInputStream()) {
        Files.copy(in, target);
      }
    } catch (IOException e) {
      throw new IllegalStateException("Failed to upload file", e);
    }

    return "/public-objects/" + relativePath;
  }
}
