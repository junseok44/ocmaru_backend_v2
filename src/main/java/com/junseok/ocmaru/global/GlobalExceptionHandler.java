package com.junseok.ocmaru.global;

import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler
  public ResponseEntity<String> handleRuntimeError(IllegalArgumentException e) {
    return ResponseEntity.badRequest().body("Error" + e.getMessage());
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<String> handleNotFound(NotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<String> handleUnauthorized(UnauthorizedException e) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
  }
}
