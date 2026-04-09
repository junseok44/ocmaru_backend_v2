package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.domain.auth.OAuthUserService;
import com.junseok.ocmaru.global.config.properties.OAuthProperties;
import com.junseok.ocmaru.global.security.JwtTokenService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/**
 * OAuth2 클라이언트 등록 및 로그인 성공 처리.
 * Google/Kakao 중 하나라도 설정된 경우에만 빈을 등록한다 ({@link OAuth2ClientsEnabledCondition}).
 */
@Configuration
@Profile("!worker")
@Conditional(OAuth2ClientsEnabledCondition.class)
@RequiredArgsConstructor
public class OAuth2LoginConfig {

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

    if (registrations.isEmpty()) {
      throw new IllegalStateException(
        "OAuth2ClientsEnabledCondition 과 불일치: 등록할 클라이언트가 없습니다."
      );
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
}
