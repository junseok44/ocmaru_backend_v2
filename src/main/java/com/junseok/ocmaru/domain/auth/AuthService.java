package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.LocalLoginRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalLoginResponse;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterResponse;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public LocalRegisterResponse localRegister(LocalRegisterRequestDto dto) {
    String encodedPassword = passwordEncoder.encode(dto.getPassword());
    User user = new User(dto.getEmail(), encodedPassword, dto.getUsername());
    User saved = userRepository.save(user);
    return LocalRegisterResponse.from(saved);
  }

  public LocalLoginResponse localLogin(LocalLoginRequestDto dto) {
    User findUser = userRepository
      .findByEmail(dto.getEmail())
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));

    if (!findUser.matchesPassword(passwordEncoder, dto.getPassword())) {
      throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");
    }
    return LocalLoginResponse.from(findUser);
  }
}
