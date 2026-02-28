package com.junseok.ocmaru.domain.agenda.dto;

public record AgendaVoteStatResponseDto(
  int total,
  int agree,
  int disagree,
  int neutral
) {}
