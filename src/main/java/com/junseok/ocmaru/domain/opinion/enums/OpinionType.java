package com.junseok.ocmaru.domain.opinion.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OpinionType {
  TEXT,
  VOICE;

  @JsonCreator
  public static OpinionType from(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return OpinionType.valueOf(value.trim().toUpperCase());
  }
}
