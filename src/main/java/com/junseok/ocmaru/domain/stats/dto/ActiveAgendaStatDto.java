package com.junseok.ocmaru.domain.stats.dto;

public record ActiveAgendaStatDto(
  Long id,
  String title,
  String description,
  String status,
  Integer voteCount,
  Integer viewCount,
  long commentCount,
  long activityScore
) {}
