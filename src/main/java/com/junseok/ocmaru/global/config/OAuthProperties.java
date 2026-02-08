package com.junseok.ocmaru.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OAuth(Google, Kakao) 환경변수 주입용 설정.
 * <p>
 * 환경변수: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET,
 * BASE_URL(또는 PUBLIC_URL, HOST). application.properties에서 ${VAR:} 형태로 바인딩됨.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.oauth")
public class OAuthProperties {

  /**
   * OAuth 콜백 등에 사용할 서버 기준 URL.
   * 우선순위: BASE_URL → PUBLIC_URL → HOST → http://localhost:8080
   * 끝의 슬래시는 제거되어 사용됨.
   */
  private String baseUrl = "http://localhost:8080";

  /** 콜백 URL 등에 쓸 때 사용 (끝 슬래시 제거). */
  public String getBaseUrlNormalized() {
    if (baseUrl == null || baseUrl.isBlank()) {
      return "http://localhost:8080";
    }
    return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
  }

  private Google google = new Google();
  private Kakao kakao = new Kakao();

  public boolean isGoogleEnabled() {
    return google != null
        && hasText(google.getClientId())
        && hasText(google.getClientSecret());
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
