package com.junseok.ocmaru.domain.agenda.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AgendaUpdateRequestDto(
  @Size(max = 200) String title,
  @Size(max = 1000) String summary,
  Integer similarity,
  @NotNull List<Long> opinionIds
) {}
