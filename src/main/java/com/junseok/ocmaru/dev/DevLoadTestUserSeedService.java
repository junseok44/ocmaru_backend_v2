package com.junseok.ocmaru.dev;

import com.junseok.ocmaru.dev.dto.LoadTestUsersSeedResponseDto;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * k6 등 부하테스트에서 유저 풀을 미리 만들 때 사용.
 * 이메일: {@code loadtest-{1..N}@loadtest.local}, 동일 비밀번호.
 */
@Service
@RequiredArgsConstructor
public class DevLoadTestUserSeedService {

  public static final String EMAIL_PREFIX = "loadtest-";
  public static final String EMAIL_DOMAIN = "@loadtest.local";
  /** 기본 비밀번호 (환경변수로 k6와 맞출 것) */
  public static final String DEFAULT_PLAIN_PASSWORD = "loadtest-password!";

  private static final int MAX_BATCH = 10_000;

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  public LoadTestUsersSeedResponseDto seedUsers(int requestedCount) {
    if (requestedCount <= 0) {
      throw new IllegalArgumentException("count는 1 이상이어야 합니다.");
    }
    if (requestedCount > MAX_BATCH) {
      throw new IllegalArgumentException(
        "count는 " + MAX_BATCH + " 이하로 지정하세요."
      );
    }

    int created = 0;
    int skipped = 0;
    String encoded = passwordEncoder.encode(DEFAULT_PLAIN_PASSWORD);

    for (int i = 1; i <= requestedCount; i++) {
      String email = EMAIL_PREFIX + i + EMAIL_DOMAIN;
      if (userRepository.findByEmail(email).isPresent()) {
        skipped++;
        continue;
      }
      User user = new User(
        email,
        encoded,
        "부하테스트유저" + i
      );
      userRepository.save(user);
      created++;
    }

    return new LoadTestUsersSeedResponseDto(
      requestedCount,
      created,
      skipped,
      EMAIL_PREFIX + "{n}" + EMAIL_DOMAIN,
      "서버 기본값과 동일할 때: " + DEFAULT_PLAIN_PASSWORD
    );
  }
}
