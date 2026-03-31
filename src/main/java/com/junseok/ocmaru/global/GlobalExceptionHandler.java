package com.junseok.ocmaru.global;

import com.junseok.ocmaru.global.exception.ClusterGenerateBusyException;
import com.junseok.ocmaru.global.exception.ClusterGenerateBusyResult;
import com.junseok.ocmaru.global.exception.ErrorResult;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(
    GlobalExceptionHandler.class
  );

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResult> handleIllegalArgument(
    IllegalArgumentException e
  ) {
    log.warn("Illegal argument: {}", e.getMessage(), e);
    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(new ErrorResult("BAD_REQUEST", e.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResult> handleValidationError(
    MethodArgumentNotValidException e
  ) {
    String message = e
      .getBindingResult()
      .getFieldErrors()
      .stream()
      .map(FieldError::getDefaultMessage)
      .collect(Collectors.joining(", "));

    if (message.isBlank()) {
      message = "요청값 검증에 실패했습니다.";
    }

    log.warn("Validation error: {}", message, e);
    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(new ErrorResult("VALIDATION_ERROR", message));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResult> handleNotReadable(
    HttpMessageNotReadableException e
  ) {
    log.warn("Unreadable request body", e);
    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(new ErrorResult("MALFORMED_JSON", "요청 본문 형식이 올바르지 않습니다."));
  }

  @ExceptionHandler(ClusterGenerateBusyException.class)
  public ResponseEntity<ClusterGenerateBusyResult> handleClusterGenerateBusy(
    ClusterGenerateBusyException e
  ) {
    log.warn("Cluster generate busy: {}", e.getMessage());
    return ResponseEntity
      .status(HttpStatus.CONFLICT)
      .body(
        new ClusterGenerateBusyResult(
          "CLUSTER_GENERATE_BUSY",
          e.getMessage(),
          e.getActiveJobId()
        )
      );
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResult> handleNotFound(NotFoundException e) {
    log.warn("Not found: {}", e.getMessage(), e);
    return ResponseEntity
      .status(HttpStatus.NOT_FOUND)
      .body(new ErrorResult("NOT_FOUND", e.getMessage()));
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ErrorResult> handleUnauthorized(UnauthorizedException e) {
    log.warn("Unauthorized: {}", e.getMessage(), e);
    return ResponseEntity
      .status(HttpStatus.UNAUTHORIZED)
      .body(new ErrorResult("UNAUTHORIZED", e.getMessage()));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResult> handleAccessDenied(AccessDeniedException e) {
    log.warn("Access denied: {}", e.getMessage(), e);
    return ResponseEntity
      .status(HttpStatus.FORBIDDEN)
      .body(new ErrorResult("FORBIDDEN", "접근 권한이 없습니다."));
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ErrorResult> handleNoResource(NoResourceFoundException e) {
    log.warn("No resource found: {}", e.getMessage());
    return ResponseEntity
      .status(HttpStatus.NOT_FOUND)
      .body(new ErrorResult("NOT_FOUND", "요청한 리소스를 찾을 수 없습니다."));
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResult> handleMethodNotSupported(
    HttpRequestMethodNotSupportedException e
  ) {
    log.warn("Method not supported: {}", e.getMessage());
    return ResponseEntity
      .status(HttpStatus.METHOD_NOT_ALLOWED)
      .body(new ErrorResult("METHOD_NOT_ALLOWED", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResult> handleUnexpected(Exception e) {
    log.error("Unhandled exception", e);
    return ResponseEntity
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .body(
        new ErrorResult(
          "INTERNAL_SERVER_ERROR",
          "서버 내부 오류가 발생했습니다."
        )
      );
  }
}
