package com.junseok.ocmaru.domain.agenda.dto;

import java.util.List;

public record AgendaFilesUpdateRequestDto(
  List<String> referenceLinks,
  List<String> referenceFiles
) {}
