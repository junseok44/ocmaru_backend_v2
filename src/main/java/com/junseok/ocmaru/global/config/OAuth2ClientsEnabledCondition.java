package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.config.properties.OAuthProperties;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Google 또는 Kakao OAuth 클라이언트가 하나라도 설정된 경우에만 매칭.
 * {@link OAuthProperties#isGoogleEnabled()} / {@link OAuthProperties#isKakaoEnabled()} 와 동일한 기준.
 */
public class OAuth2ClientsEnabledCondition implements Condition {

  @Override
  public boolean matches(
    ConditionContext context,
    AnnotatedTypeMetadata metadata
  ) {
    var env = context.getEnvironment();
    String googleId = env.getProperty("app.oauth.google.client-id", "");
    String googleSecret = env.getProperty("app.oauth.google.client-secret", "");
    String kakaoId = env.getProperty("app.oauth.kakao.client-id", "");
    boolean google =
      StringUtils.hasText(googleId) && StringUtils.hasText(googleSecret);
    boolean kakao = StringUtils.hasText(kakaoId);
    return google || kakao;
  }
}
