package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.user.AuthProvider;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * OAuth2 로그인 시 제공자별로 사용자 조회/생성.
 */
@Service
@RequiredArgsConstructor
public class OAuthUserService {

  private static final String OAUTH_EMAIL_PLACEHOLDER_DOMAIN =
    "@oauth.placeholder";
  private static final String DISPLAY_NAME_PREFIX = "익명의 옥천 주민 ";
  private static final String RANDOM_CHARS = "abcdefghijklmnopqrstuvwxyz";
  private static final int MAX_USERNAME_ATTEMPTS = 10;

  private final UserRepository userRepository;

  @Transactional
  public User findOrCreate(OAuth2User oauth2User, String registrationId) {
    AuthProvider provider = toAuthProvider(registrationId);
    String providerId = getProviderId(oauth2User, registrationId);
    if (providerId == null || providerId.isBlank()) {
      throw new IllegalStateException(
        "OAuth2 provider id not found: " + registrationId
      );
    }

    Optional<User> existing = userRepository.findByAuthProviderAndProvderId(
      provider,
      providerId
    );

    if (existing.isPresent()) {
      User user = existing.get();
      normalizeDisplayNameIfNeeded(user);
      return user;
    }

    String email = getEmail(oauth2User, registrationId, providerId);
    String displayName = getDisplayName(oauth2User, registrationId);
    String avatarUrl = getAvatarUrl(oauth2User, registrationId);

    for (int attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
      String candidateDisplayName = displayName != null &&
        !displayName.isBlank()
        ? displayName
        : DISPLAY_NAME_PREFIX + randomSuffix();
      User newUser = new User(
        email,
        providerId,
        provider,
        candidateDisplayName
      );
      if (avatarUrl != null) {
        newUser.setAvatarUrl(avatarUrl);
      }
      try {
        return userRepository.save(newUser);
      } catch (Exception e) {
        if (isDuplicateKey(e) && attempt < MAX_USERNAME_ATTEMPTS - 1) {
          continue;
        }
        throw e;
      }
    }
    throw new IllegalStateException("Failed to create unique OAuth user");
  }

  private static AuthProvider toAuthProvider(String registrationId) {
    return switch (registrationId.toLowerCase()) {
      case "google" -> AuthProvider.GOOGLE;
      case "kakao" -> AuthProvider.KAKAO;
      default -> throw new IllegalArgumentException(
        "Unsupported registration: " + registrationId
      );
    };
  }

  private static String getProviderId(
    OAuth2User oauth2User,
    String registrationId
  ) {
    Map<String, Object> attrs = oauth2User.getAttributes();
    if ("google".equals(registrationId)) {
      Object sub = attrs.get("sub");
      return sub != null ? sub.toString() : null;
    }
    if ("kakao".equals(registrationId)) {
      Object id = attrs.get("id");
      return id != null ? id.toString() : null;
    }
    return null;
  }

  private static String getEmail(
    OAuth2User oauth2User,
    String registrationId,
    String providerId
  ) {
    Map<String, Object> attrs = oauth2User.getAttributes();
    if ("google".equals(registrationId)) {
      Object email = attrs.get("email");
      if (email != null && email.toString().length() > 0) {
        return email.toString();
      }
    }
    if ("kakao".equals(registrationId)) {
      @SuppressWarnings("unchecked")
      Map<String, Object> kakaoAccount = (Map<String, Object>) attrs.get(
        "kakao_account"
      );
      if (kakaoAccount != null) {
        Object email = kakaoAccount.get("email");
        if (email != null && email.toString().length() > 0) {
          return email.toString();
        }
      }
    }
    return (
      registrationId.toLowerCase() +
      "_" +
      providerId +
      OAUTH_EMAIL_PLACEHOLDER_DOMAIN
    );
  }

  private static String getDisplayName(
    OAuth2User oauth2User,
    String registrationId
  ) {
    Map<String, Object> attrs = oauth2User.getAttributes();
    if ("google".equals(registrationId)) {
      Object name = attrs.get("name");
      return name != null ? name.toString().trim() : null;
    }
    if ("kakao".equals(registrationId)) {
      @SuppressWarnings("unchecked")
      Map<String, Object> kakaoAccount = (Map<String, Object>) attrs.get(
        "kakao_account"
      );
      if (kakaoAccount != null) {
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get(
          "profile"
        );
        if (profile != null) {
          Object nickname = profile.get("nickname");
          if (nickname != null && nickname.toString().length() > 0) {
            return nickname.toString().trim();
          }
        }
      }
      Object name = attrs.get("name");
      return name != null ? name.toString().trim() : null;
    }
    return null;
  }

  private static String getAvatarUrl(
    OAuth2User oauth2User,
    String registrationId
  ) {
    Map<String, Object> attrs = oauth2User.getAttributes();
    if ("google".equals(registrationId)) {
      Object picture = attrs.get("picture");
      return picture != null ? picture.toString() : null;
    }
    if ("kakao".equals(registrationId)) {
      @SuppressWarnings("unchecked")
      Map<String, Object> kakaoAccount = (Map<String, Object>) attrs.get(
        "kakao_account"
      );
      if (kakaoAccount != null) {
        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get(
          "profile"
        );
        if (profile != null) {
          Object url = profile.get("profile_image_url");
          return url != null ? url.toString() : null;
        }
      }
    }
    return null;
  }

  private void normalizeDisplayNameIfNeeded(User user) {
    if ("미연동 계정".equals(user.getDisplayName())) {
      user.setDisplayName(DISPLAY_NAME_PREFIX + randomSuffix());
    }
  }

  private static String randomSuffix() {
    StringBuilder sb = new StringBuilder(3);
    for (int i = 0; i < 3; i++) {
      sb.append(
        RANDOM_CHARS.charAt(
          ThreadLocalRandom.current().nextInt(RANDOM_CHARS.length())
        )
      );
    }
    return sb.toString();
  }

  private static boolean isDuplicateKey(Exception e) {
    String msg = e.getMessage();
    return (
      msg != null &&
      (
        msg.contains("23505") ||
        msg.contains("Unique") ||
        msg.contains("duplicate")
      )
    );
  }
}
