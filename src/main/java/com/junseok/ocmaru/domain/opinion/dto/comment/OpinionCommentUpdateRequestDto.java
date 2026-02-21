package com.junseok.ocmaru.domain.opinion.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OpinionCommentUpdateRequestDto(
  @NotNull(message = "content는 필수입니다.")
  @NotBlank(message = "content는 비어있을 수 없습니다.")
  @Size(max = 200, message = "content는 200자 이하여야 합니다.")
  String content
) {}
