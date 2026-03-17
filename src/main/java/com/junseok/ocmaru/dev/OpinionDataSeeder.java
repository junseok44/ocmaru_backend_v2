package com.junseok.ocmaru.dev;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpinionDataSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final OpinionRepository opinionRepository;

  @Value("${app.seed.enabled:false}")
  private boolean seedEnabled;

  @Value("${app.seed.user-count:100}")
  private int userCount;

  @Value("${app.seed.opinions-per-user:50}")
  private int opinionsPerUser;

  @Override
  @Transactional
  public void run(String... args) {
    if (!seedEnabled) {
      return;
    }

    log.info(
      "Starting opinion data seeding: {} users, {} opinions per user",
      userCount,
      opinionsPerUser
    );

    List<User> users = new ArrayList<>(userCount);
    for (int i = 1; i <= userCount; i++) {
      String email = "seeduser" + i + "@example.com";
      String password = "password" + i;
      String displayName = "시드유저" + i;

      User user = new User(email, password, displayName);
      users.add(user);
    }
    userRepository.saveAll(users);

    List<Opinion> opinions = new ArrayList<>(userCount * opinionsPerUser);
    for (User user : users) {
      for (int i = 1; i <= opinionsPerUser; i++) {
        String content = "시드 의견 " + i + " - user=" + user.getEmail();
        opinions.add(new Opinion(user, content));
      }
    }
    opinionRepository.saveAll(opinions);

    log.info(
      "Completed opinion data seeding: {} users, {} opinions",
      users.size(),
      opinions.size()
    );
  }
}
