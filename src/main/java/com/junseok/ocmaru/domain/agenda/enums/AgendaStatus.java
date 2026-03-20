package com.junseok.ocmaru.domain.agenda.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Arrays;

public enum AgendaStatus {
  CREATED,
  VOTING,
  PROPOSING,
  ANSWERED,
  EXECUTING;

  @JsonCreator
  public static AgendaStatus from(String value) {
    if (value == null) {
      return null;
    }
    return Arrays
      .stream(values())
      .filter(status -> status.name().equalsIgnoreCase(value))
      .findFirst()
      .orElseThrow(() ->
        new IllegalArgumentException("지원하지 않는 AgendaStatus 입니다: " + value)
      );
  }
}
