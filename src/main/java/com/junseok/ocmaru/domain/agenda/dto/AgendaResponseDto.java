package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;

public record AgendaResponseDto(Long id, String title, String description) {
  public static AgendaResponseDto from(Agenda agenda) {
    if (agenda == null) {
      return null;
    }
    return new AgendaResponseDto(
      agenda.getId(),
      agenda.getTitle(),
      agenda.getDescription()
    );
  }
}
