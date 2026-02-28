package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import jakarta.validation.constraints.NotNull;

public record AgendaVoteCreateRequestDto(
  @NotNull(message = "agendaId는 필수입니다.") Long agendaId,
  @NotNull(message = "voteType는 필수입니다.") AgendaVoteType voteType
) {}
