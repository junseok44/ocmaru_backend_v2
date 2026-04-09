package com.junseok.ocmaru.global.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OAuth(Google, Kakao) 환경변수 주입용 설정.
 * <p>
 * 환경변수: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET,
 * BASE_URL(백엔드 공개 URL·OAuth redirect용), FRONTEND_URL(로그인 후 리다이렉트용 SPA origin).
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.oauth")
public class OAuthProperties {

  /**
   * 백엔드(이 Spring 앱)의 공개 URL. Google/Kakao에 등록한 redirect URI
   * ({@code {baseUrl}/login/oauth2/code/{registrationId}})를 만들 때 사용한다.
   * 프론트 주소(FRONTEND_URL)와는 역할이 다르다.
   */
  private String baseUrl = "http://localhost:8080";

  /**
   * 로그인 성공 후 브라우저를 보낼 프런트엔드 origin (토큰 쿼리로 붙여 리다이렉트).
   * {@link #baseUrl}과 동일하게 두면 안 되는 경우가 많다 (API는 8080, SPA는 5173 등).
   */
  private String frontendRedirectUrl = "http://localhost:8080";

  /** 콜백 URL 등에 쓸 때 사용 (끝 슬래시 제거). */
  public String getBaseUrlNormalized() {
    if (baseUrl == null || baseUrl.isBlank()) {
      return "http://localhost:8080";
    }
    return baseUrl.endsWith("/")
      ? baseUrl.substring(0, baseUrl.length() - 1)
      : baseUrl;
  }

  /** 프런트 리다이렉트 URL 정규화 (끝 슬래시 제거). */
  public String getFrontendRedirectUrlNormalized() {
    if (frontendRedirectUrl == null || frontendRedirectUrl.isBlank()) {
      return "http://localhost:8080";
    }
    return frontendRedirectUrl.endsWith("/")
      ? frontendRedirectUrl.substring(0, frontendRedirectUrl.length() - 1)
      : frontendRedirectUrl;
  }

  private Google google = new Google();
  private Kakao kakao = new Kakao();

  public boolean isGoogleEnabled() {
    return (
      google != null &&
      hasText(google.getClientId()) &&
      hasText(google.getClientSecret())
    );
  }

  public boolean isKakaoEnabled() {
    return kakao != null && hasText(kakao.getClientId());
  }

  private static boolean hasText(String s) {
    return s != null && !s.isBlank();
  }

  @Getter
  @Setter
  public static class Google {

    private String clientId = "";
    private String clientSecret = "";
  }

  @Getter
  @Setter
  public static class Kakao {

    private String clientId = "";
    private String clientSecret = "";
  }
}
