package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.domain.auth.OAuthUserService;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.config.properties.OAuthProperties;
import com.junseok.ocmaru.global.security.JwtTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * OAuth2 로그인 성공 시 DB 사용자 조회/생성 후 JWT를 발급해서 프론트 로그인 페이지로 리다이렉트.
 */
public class OAuth2AuthenticationSuccessHandler
  extends SimpleUrlAuthenticationSuccessHandler {

  private final OAuthProperties oAuthProperties;
  private final OAuthUserService oAuthUserService;
  private final JwtTokenService jwtTokenService;

  public OAuth2AuthenticationSuccessHandler(
    OAuthProperties oAuthProperties,
    OAuthUserService oAuthUserService,
    JwtTokenService jwtTokenService
  ) {
    this.oAuthProperties = oAuthProperties;
    this.oAuthUserService = oAuthUserService;
    this.jwtTokenService = jwtTokenService;
    setDefaultTargetUrl(
      oAuthProperties.getFrontendRedirectUrlNormalized() + "/login"
    );
  }

  @Override
  public void onAuthenticationSuccess(
    HttpServletRequest request,
    HttpServletResponse response,
    Authentication authentication
  ) throws IOException {
    if (!(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
      getRedirectStrategy()
        .sendRedirect(request, response, getDefaultTargetUrl());
      return;
    }

    String registrationId = resolveRegistrationIdFromRequest(request);
    if (registrationId == null) {
      getRedirectStrategy()
        .sendRedirect(request, response, getDefaultTargetUrl());
      return;
    }

    try {
      User user = oAuthUserService.findOrCreate(oauth2User, registrationId);
      String accessToken = jwtTokenService.createAccessToken(user);
      String refreshToken = jwtTokenService.createRefreshToken(user);
      String redirectUrl = UriComponentsBuilder
        .fromUriString(
          oAuthProperties.getFrontendRedirectUrlNormalized() + "/login"
        )
        .queryParam("accessToken", accessToken)
        .queryParam("refreshToken", refreshToken)
        .build()
        .toUriString();
      getRedirectStrategy().sendRedirect(request, response, redirectUrl);
      return;
    } catch (Exception e) {
      // 실패 시 토큰 발급 없이 기본 로그인 화면으로 이동
    }

    getRedirectStrategy()
      .sendRedirect(request, response, getDefaultTargetUrl());
  }

  /** 콜백 URL /login/oauth2/code/{registrationId} 에서 registrationId 추출. */
  private String resolveRegistrationIdFromRequest(HttpServletRequest request) {
    String path = request.getRequestURI();
    String prefix = "/login/oauth2/code/";
    if (path != null && path.startsWith(prefix)) {
      String rest = path.substring(prefix.length());
      int slash = rest.indexOf('/');
      return slash >= 0 ? rest.substring(0, slash) : rest;
    }
    return null;
  }
}
