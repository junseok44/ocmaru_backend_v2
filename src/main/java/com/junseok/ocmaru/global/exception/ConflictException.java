package com.junseok.ocmaru.global.exception;

/** 동시 요청·리소스 충돌 등 (HTTP 409) */
public class ConflictException extends RuntimeException {

  public ConflictException(String message) {
    super(message);
  }
}
