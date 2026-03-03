package com.junseok.ocmaru.global.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PublicObjectStorageService {

  private final Path publicRootDir;

  public PublicObjectStorageService(
    @Value("${app.storage.public-dir:public-objects}") String publicDir
  ) {
    this.publicRootDir = Paths.get(publicDir).toAbsolutePath().normalize();
  }

  public String uploadAgendaFile(Long agendaId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("No file provided");
    }

    String originalName = file.getOriginalFilename() == null
      ? "file"
      : Paths.get(file.getOriginalFilename()).getFileName().toString();
    String filename =
      "agendas/" +
      agendaId +
      "/" +
      System.currentTimeMillis() +
      "-" +
      originalName;
    Path target = publicRootDir.resolve(filename).normalize();

    try {
      Files.createDirectories(target.getParent());
      try (InputStream in = file.getInputStream()) {
        Files.copy(in, target);
      }
    } catch (IOException e) {
      throw new IllegalStateException("Failed to upload file", e);
    }

    return "/public-objects/" + filename;
  }
}
