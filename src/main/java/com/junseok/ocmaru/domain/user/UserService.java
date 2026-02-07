package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;

  public User findById(Long id) {
    return userRepository
      .findById(id)
      .orElseThrow(() -> new NotFoundException("유저를 찾을 수 없습니다."));
  }
}
