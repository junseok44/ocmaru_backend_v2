package com.junseok.ocmaru.global.security;

import com.junseok.ocmaru.domain.cluster.job.ClusterJobProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class InternalWorkerApiKeyFilter extends OncePerRequestFilter {

  private static final String HEADER = "X-Internal-Api-Key";

  private final ClusterJobProperties clusterJobProperties;
  private final Environment environment;

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    String path = request.getRequestURI();
    return !path.startsWith("/api/internal/worker/");
  }

  @Override
  protected void doFilterInternal(
    @NonNull HttpServletRequest request,
    @NonNull HttpServletResponse response,
    @NonNull FilterChain filterChain
  ) throws ServletException, IOException {
    String expected = clusterJobProperties.getInternalApiKey();
    boolean workerProfile =
      Arrays.asList(environment.getActiveProfiles()).contains("worker");

    if (expected == null || expected.isBlank()) {
      if (workerProfile) {
        response.sendError(HttpStatus.UNAUTHORIZED.value());
        return;
      }
      filterChain.doFilter(request, response);
      return;
    }

    String provided = request.getHeader(HEADER);
    if (provided == null || !expected.equals(provided)) {
      response.sendError(HttpStatus.UNAUTHORIZED.value());
      return;
    }
    filterChain.doFilter(request, response);
  }
}
