package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.domain.auth.OAuthUserService;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.security.JwtTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * OAuth2 클라이언트 등록 및 로그인 성공 처리.
 * OAuthProperties 기준으로 활성화된 제공자만 등록함.
 */
@Configuration
@RequiredArgsConstructor
public class OAuth2Config {

  private static final String KAKAO_AUTH_URI =
    "https://kauth.kakao.com/oauth/authorize";
  private static final String KAKAO_TOKEN_URI =
    "https://kauth.kakao.com/oauth/token";
  private static final String KAKAO_USER_INFO_URI =
    "https://kapi.kakao.com/v2/user/me";

  private final OAuthProperties oAuthProperties;
  private final OAuthUserService oAuthUserService;
  private final JwtTokenService jwtTokenService;

  @Bean
  public ClientRegistrationRepository clientRegistrationRepository() {
    List<ClientRegistration> registrations = new ArrayList<>();
    String baseUrl = oAuthProperties.getBaseUrlNormalized();

    if (oAuthProperties.isGoogleEnabled()) {
      registrations.add(googleRegistration(baseUrl));
    }
    if (oAuthProperties.isKakaoEnabled()) {
      registrations.add(kakaoRegistration(baseUrl));
    }

    return new InMemoryClientRegistrationRepository(registrations);
  }

  private ClientRegistration googleRegistration(String baseUrl) {
    return ClientRegistration
      .withRegistrationId("google")
      .clientId(oAuthProperties.getGoogle().getClientId())
      .clientSecret(oAuthProperties.getGoogle().getClientSecret())
      .clientAuthenticationMethod(
        ClientAuthenticationMethod.CLIENT_SECRET_BASIC
      )
      .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
      .redirectUri(baseUrl + "/login/oauth2/code/google")
      .scope("openid", "profile", "email")
      .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
      .tokenUri("https://oauth2.googleapis.com/token")
      .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
      .userNameAttributeName("sub")
      .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
      .build();
  }

  private ClientRegistration kakaoRegistration(String baseUrl) {
    return ClientRegistration
      .withRegistrationId("kakao")
      .clientId(oAuthProperties.getKakao().getClientId())
      .clientSecret(
        oAuthProperties.getKakao().getClientSecret() != null
          ? oAuthProperties.getKakao().getClientSecret()
          : ""
      )
      .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
      .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
      .redirectUri(baseUrl + "/login/oauth2/code/kakao")
      .scope("profile", "account_email")
      .authorizationUri(KAKAO_AUTH_URI)
      .tokenUri(KAKAO_TOKEN_URI)
      .userInfoUri(KAKAO_USER_INFO_URI)
      .userNameAttributeName("id")
      .build();
  }

  @Bean
  public OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler() {
    return new OAuth2AuthenticationSuccessHandler(
      oAuthProperties,
      oAuthUserService,
      jwtTokenService
    );
  }

  /**
   * OAuth2 로그인 성공 시 DB 사용자 조회/생성 후 JWT를 발급해서 프론트 로그인 페이지로 리다이렉트.
   */
  public static class OAuth2AuthenticationSuccessHandler
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
      setDefaultTargetUrl(oAuthProperties.getFrontendRedirectUrlNormalized() + "/login");
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
    private String resolveRegistrationIdFromRequest(
      HttpServletRequest request
    ) {
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
}
