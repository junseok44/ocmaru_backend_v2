package com.junseok.ocmaru.domain.agenda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AgendaCreateRequestDto(
  @NotBlank(message = "제목을 입력해주세요") @Size(max = 200) String title,

  @NotBlank(message = "요약을 입력해주세요") @Size(max = 1000) String summary,
  Integer similarity,
  @NotNull(message = "opinionIds는 필수입니다.") List<Long> opinionIds
) {}
