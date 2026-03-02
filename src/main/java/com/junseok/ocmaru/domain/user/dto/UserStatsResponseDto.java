package com.junseok.ocmaru.domain.user.dto;

public record UserStatsResponseDto(
  long myOpinionsCount,
  long likedOpinionsCount,
  long myAgendasCount,
  long bookmarkedAgendasCount
) {}
