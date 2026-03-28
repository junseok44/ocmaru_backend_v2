package com.junseok.ocmaru.global.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청 단위 식별자(requestId/traceId)와 URI를 MDC에 넣어
 * 애플리케이션 로그 + p6spy SQL 로그를 같은 키로 추적할 수 있게 한다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTraceMdcFilter extends OncePerRequestFilter {

  private static final String HEADER_REQUEST_ID = "X-Request-Id";
  private static final String HEADER_TRACE_ID = "X-Trace-Id";
  private static final String HEADER_B3_TRACE_ID = "X-B3-TraceId";
  private static final String HEADER_TRACEPARENT = "traceparent";

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String requestId = pickOrGenerateRequestId(request.getHeader(HEADER_REQUEST_ID));
    String traceId = pickOrGenerateTraceId(request);

    MDC.put("requestId", requestId);
    MDC.put("traceId", traceId);
    MDC.put("method", request.getMethod());
    MDC.put("uri", request.getRequestURI());

    response.setHeader(HEADER_REQUEST_ID, requestId);
    response.setHeader(HEADER_TRACE_ID, traceId);

    try {
      filterChain.doFilter(request, response);
    } finally {
      MDC.remove("requestId");
      MDC.remove("traceId");
      MDC.remove("method");
      MDC.remove("uri");
    }
  }

  private String pickOrGenerateRequestId(String requestIdHeader) {
    if (requestIdHeader == null || requestIdHeader.isBlank()) {
      return UUID.randomUUID().toString();
    }
    return requestIdHeader;
  }

  private String pickOrGenerateTraceId(HttpServletRequest request) {
    String traceparent = request.getHeader(HEADER_TRACEPARENT);
    if (traceparent != null && !traceparent.isBlank()) {
      String[] parts = traceparent.split("-");
      if (parts.length >= 2 && parts[1].length() == 32) {
        return parts[1];
      }
    }

    String b3 = request.getHeader(HEADER_B3_TRACE_ID);
    if (b3 != null && !b3.isBlank()) {
      return b3;
    }

    String traceIdHeader = request.getHeader(HEADER_TRACE_ID);
    if (traceIdHeader != null && !traceIdHeader.isBlank()) {
      return traceIdHeader;
    }

    return UUID.randomUUID().toString().replace("-", "");
  }
}
