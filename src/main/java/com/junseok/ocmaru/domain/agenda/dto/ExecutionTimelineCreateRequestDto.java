package com.junseok.ocmaru.domain.agenda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record ExecutionTimelineCreateRequestDto(
  @NotBlank(message = "content는 필수입니다.")
  @Size(max = 200, message = "content은 200자 이하여야 합니다.")
  String content,
  @NotBlank(message = "imageUrl는 필수입니다.") String imageUrl,
  @Size(max = 200, message = "authorName은 200자 이하여야 합니다.")
  String authorName
) {}
