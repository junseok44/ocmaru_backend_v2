package com.junseok.ocmaru.global.exception;

import java.util.UUID;

public record ClusterGenerateBusyResult(
  String code,
  String message,
  UUID activeJobId
) {}
