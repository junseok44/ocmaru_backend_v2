package com.junseok.ocmaru.domain.stats.dto;

import java.time.LocalDate;

public record WeeklyOpinionStatDto(
  LocalDate date,
  String day,
  long count,
  boolean isToday
) {}
