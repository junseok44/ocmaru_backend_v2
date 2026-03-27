package com.junseok.ocmaru.dev.dto;

/**
 * 부하테스트용 계정 대량 생성 결과.
 */
public record LoadTestUsersSeedResponseDto(
  int requested,
  int created,
  int skippedExisting,
  String emailPattern,
  String passwordHint
) {}
