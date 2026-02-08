package com.junseok.ocmaru.domain.auth.dto;

import com.junseok.ocmaru.domain.user.AuthProvider;
import com.junseok.ocmaru.domain.user.User;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 제공자(Google, Kakao 등)별로 제각각인 사용자 정보를 하나의 규격으로 묶는 DTO.
 * OAuth2User.getAttributes()를 우리 도메인 규격으로 변환.
 * <p>
 * 확장: 네이버 등 추가 시 of(registrationId, ...)와 ofNaver()만 추가하면 됨.
 */
@Getter
public class OAuthAttributes {

  private static final String OAUTH_EMAIL_PLACEHOLDER_DOMAIN = "@oauth.placeholder";

  private final Map<String, Object> attributes;
  private final String nameAttributeKey;
  private final String providerId;
  private final String displayName;
  private final String email;
  private final String picture;
  private final AuthProvider authProvider;

  @Builder
  public OAuthAttributes(
    Map<String, Object> attributes,
    String nameAttributeKey,
    String providerId,
    String displayName,
    String email,
    String picture,
    AuthProvider authProvider
  ) {
    this.attributes = attributes;
    this.nameAttributeKey = nameAttributeKey;
    this.providerId = providerId;
    this.displayName = displayName;
    this.email = email;
    this.picture = picture;
    this.authProvider = authProvider;
  }

  /**
   * registrationId와 attributes로 공통 DTO 생성.
   */
  public static OAuthAttributes of(String registrationId, Map<String, Object> attributes) {
    if (registrationId == null) {
      throw new IllegalArgumentException("registrationId is required");
    }
    return switch (registrationId.toLowerCase()) {
      case "kakao" -> ofKakao(attributes);
      case "google" -> ofGoogle(attributes);
      default -> throw new IllegalArgumentException("Unsupported registration: " + registrationId);
    };
  }

  private static OAuthAttributes ofGoogle(Map<String, Object> attributes) {
    String sub = getString(attributes, "sub");
    if (sub == null || sub.isBlank()) {
      throw new IllegalStateException("Google attributes missing 'sub'");
    }
    String email = getString(attributes, "email");
    if (email == null || email.isBlank()) {
      email = "google_" + sub + OAUTH_EMAIL_PLACEHOLDER_DOMAIN;
    }
    return OAuthAttributes.builder()
      .attributes(attributes)
      .nameAttributeKey("sub")
      .providerId(sub)
      .displayName(trimOrNull(getString(attributes, "name")))
      .email(email)
      .picture(getString(attributes, "picture"))
      .authProvider(AuthProvider.GOOGLE)
      .build();
  }

  private static OAuthAttributes ofKakao(Map<String, Object> attributes) {
    Object idObj = attributes.get("id");
    String id = idObj != null ? idObj.toString() : null;
    if (id == null || id.isBlank()) {
      throw new IllegalStateException("Kakao attributes missing 'id'");
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
    String email = null;
    String nickname = null;
    String picture = null;

    if (kakaoAccount != null) {
      email = getString(kakaoAccount, "email");
      @SuppressWarnings("unchecked")
      Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
      if (profile != null) {
        nickname = getString(profile, "nickname");
        picture = getString(profile, "profile_image_url");
      }
    }
    if (email == null || email.isBlank()) {
      email = "kakao_" + id + OAUTH_EMAIL_PLACEHOLDER_DOMAIN;
    }

    return OAuthAttributes.builder()
      .attributes(attributes)
      .nameAttributeKey("id")
      .providerId(id)
      .displayName(trimOrNull(nickname != null ? nickname : getString(attributes, "name")))
      .email(email)
      .picture(picture)
      .authProvider(AuthProvider.KAKAO)
      .build();
  }

  private static String getString(Map<String, Object> map, String key) {
    Object v = map != null ? map.get(key) : null;
    return v != null ? v.toString() : null;
  }

  private static String trimOrNull(String s) {
    if (s == null || s.isBlank()) return null;
    return s.trim();
  }

  /**
   * 지정한 displayName으로 User 엔티티 생성 (신규 가입용).
   */
  public User toEntity(String displayName) {
    User user = new User(email, providerId, authProvider, displayName);
    if (picture != null && !picture.isBlank()) {
      user.setAvatarUrl(picture);
    }
    return user;
  }
}
