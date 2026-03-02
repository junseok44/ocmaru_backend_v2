package com.junseok.ocmaru.domain.agenda.dto;

public record AgendaFileUploadResponseDto(
  boolean success,
  String fileUrl,
  AgendaResponseDto agenda
) {}
