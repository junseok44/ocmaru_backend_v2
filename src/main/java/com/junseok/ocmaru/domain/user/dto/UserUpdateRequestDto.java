package com.junseok.ocmaru.domain.user.dto;

import jakarta.validation.constraints.Size;

public record UserUpdateRequestDto(
  @Size(min = 1, max = 50) String displayName,
  String avatarUrl
) {}
