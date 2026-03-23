package com.junseok.ocmaru.global.storage;

import org.springframework.web.multipart.MultipartFile;

/** 로컬 디스크 또는 S3 등 공개 파일 저장소 추상화 */
public interface PublicObjectStorage {

  /**
   * 안건 첨부 파일을 저장하고, 클라이언트가 접근할 수 있는 공개 URL(또는 경로)을 반환합니다.
   * 로컬: {@code /public-objects/agendas/...} 형태, S3: 설정에 따라 절대 URL.
   */
  String uploadAgendaFile(Long agendaId, MultipartFile file);
}
