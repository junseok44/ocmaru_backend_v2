package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.OAuthAttributes;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * OAuth2 로그인 시 제공자별로 사용자 조회/생성.
 * OAuthAttributes로 정제된 정보를 받아 메인 로직만 담당.
 */
@Service
@RequiredArgsConstructor
public class OAuthUserService {

  private static final String DISPLAY_NAME_PREFIX = "익명의 옥천 주민 ";
  private static final String RANDOM_CHARS = "abcdefghijklmnopqrstuvwxyz";
  private static final int MAX_USERNAME_ATTEMPTS = 10;

  private final UserRepository userRepository;

  @Transactional
  public User findOrCreate(OAuth2User oauth2User, String registrationId) {
    OAuthAttributes attrs = OAuthAttributes.of(
      registrationId,
      oauth2User.getAttributes()
    );
    return saveOrUpdate(attrs);
  }

  private User saveOrUpdate(OAuthAttributes attrs) {
    Optional<User> existing = userRepository.findByAuthProviderAndProvderId(
      attrs.getAuthProvider(),
      attrs.getProviderId()
    );

    if (existing.isPresent()) {
      User user = existing.get();
      normalizeDisplayNameIfNeeded(user);
      return user;
    }

    for (int attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
      String displayName = attrs.getDisplayName() != null &&
        !attrs.getDisplayName().isBlank()
        ? attrs.getDisplayName()
        : DISPLAY_NAME_PREFIX + randomSuffix();
      User newUser = attrs.toEntity(displayName);
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
