package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaReferences;
import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 프론트엔드에서 사용하는 Node 기반 Agenda 스키마와 최대한 유사한 형태로 응답을 제공한다.
 * (status, voteCount, viewCount, referenceLinks, referenceFiles, okinewsUrl, createdAt, updatedAt, imageUrl)
 */
public record AgendaResponseDto(
  Long id,
  String title,
  String description,
  AgendaStatus agendaStatus,
  int voteCount,
  int viewCount,
  List<String> referenceLinks,
  List<String> referenceFiles,
  String okinewsUrl,
  String imageUrl,
  LocalDateTime createdAt,
  LocalDateTime updatedAt
) {
  public static AgendaResponseDto from(Agenda agenda) {
    if (agenda == null) {
      return null;
    }

    AgendaReferences refs = agenda.getAgendaReferences();

    List<String> referenceLinks = refs != null
      ? List.copyOf(refs.getReferenceLinks()) // 값 복사
      : List.of();
    List<String> referenceFiles = refs != null
      ? List.copyOf(refs.getReferenceFiles())
      : List.of();

    String okinewsUrl = refs != null ? refs.getOkinewsUrl() : null;

    return new AgendaResponseDto(
      agenda.getId(),
      agenda.getTitle(),
      agenda.getDescription(),
      agenda.getAgendaStatus(),
      agenda.getVoteCount(),
      agenda.getViewCount(),
      referenceLinks,
      referenceFiles,
      okinewsUrl,
      agenda.getThumbnail(),
      agenda.getCreatedAt(),
      agenda.getUpdatedAt()
    );
  }
}
