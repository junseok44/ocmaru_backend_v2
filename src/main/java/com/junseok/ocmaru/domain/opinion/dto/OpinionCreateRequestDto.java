package com.junseok.ocmaru.domain.opinion.dto;

import com.junseok.ocmaru.domain.opinion.enums.OpinionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OpinionCreateRequestDto(
  @NotNull(message = "type은 필수입니다.") OpinionType type,

  @NotBlank(message = "content는 필수입니다.") String content,

  String voiceUrl
) {}
