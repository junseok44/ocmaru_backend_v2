package com.junseok.ocmaru.global.exception;

import java.util.UUID;
import lombok.Getter;

@Getter
public class ClusterGenerateBusyException extends RuntimeException {

  private final UUID activeJobId;

  public ClusterGenerateBusyException(String message, UUID activeJobId) {
    super(message);
    this.activeJobId = activeJobId;
  }
}
