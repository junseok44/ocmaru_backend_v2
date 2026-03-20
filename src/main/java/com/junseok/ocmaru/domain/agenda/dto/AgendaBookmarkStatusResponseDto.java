package com.junseok.ocmaru.domain.agenda.dto;

public record AgendaBookmarkStatusResponseDto(
  boolean isBookmarked,
  int bookmarkCount
) {}

