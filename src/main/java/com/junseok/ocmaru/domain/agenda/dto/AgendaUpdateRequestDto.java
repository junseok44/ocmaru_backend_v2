package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AgendaUpdateRequestDto(
  @Size(max = 200) String title,
  @Size(max = 1000) String summary,
  AgendaStatus status,
  String okinewsUrl,
  List<String> referenceLinks,
  List<String> referenceFiles,
  List<String> regionalCases,
  Integer similarity,
  List<Long> opinionIds
) {}
