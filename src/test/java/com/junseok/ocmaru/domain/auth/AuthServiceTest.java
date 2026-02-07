package com.junseok.ocmaru.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.junseok.ocmaru.domain.auth.dto.LocalLoginRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalLoginResponse;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterResponse;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @InjectMocks
  private AuthService authService;

  @Nested
  @DisplayName("localRegister")
  class LocalRegister {

    @Test
    @DisplayName(
      "이메일, 비밀번호, 닉네임으로 회원가입하면 인코딩 후 저장하고 응답을 반환한다"
    )
    void success() {
      LocalRegisterRequestDto dto = new LocalRegisterRequestDto(
        "닉네임",
        "test@example.com",
        "password123"
      );
      String encodedPassword = "encodedPassword";
      User savedUser = new User(
        dto.getEmail(),
        encodedPassword,
        dto.getUsername()
      );
      ReflectionTestUtils.setField(savedUser, "id", 1L);

      when(passwordEncoder.encode(dto.getPassword()))
        .thenReturn(encodedPassword);
      when(userRepository.save(any(User.class))).thenReturn(savedUser);

      LocalRegisterResponse response = authService.localRegister(dto);

      assertThat(response.getEmail()).isEqualTo(dto.getEmail());
      assertThat(response.getDisplayName()).isEqualTo(dto.getUsername());
      assertThat(response.getId()).isEqualTo(1L);
      verify(passwordEncoder).encode(dto.getPassword());
      verify(userRepository).save(any(User.class));
    }
  }

  @Nested
  @DisplayName("localLogin")
  class LocalLogin {

    @Test
    @DisplayName("이메일·비밀번호가 일치하면 로그인 응답을 반환한다")
    void success() {
      String email = "test@example.com";
      String rawPassword = "password123";
      LocalLoginRequestDto dto = new LocalLoginRequestDto(email, rawPassword);
      User user = new User(email, "encoded", "닉네임");
      ReflectionTestUtils.setField(user, "id", 1L);

      when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
      when(passwordEncoder.matches(eq(rawPassword), any())).thenReturn(true);

      LocalLoginResponse response = authService.localLogin(dto);

      assertThat(response.getEmail()).isEqualTo(email);
      assertThat(response.getDisplayName()).isEqualTo("닉네임");
      assertThat(response.getId()).isEqualTo(1L);
      verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("이메일에 해당하는 유저가 없으면 NotFoundException을 던진다")
    void userNotFound() {
      LocalLoginRequestDto dto = new LocalLoginRequestDto(
        "nonexistent@example.com",
        "password123"
      );
      when(userRepository.findByEmail(dto.getEmail()))
        .thenReturn(Optional.empty());

      assertThatThrownBy(() -> authService.localLogin(dto))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("유저가 없습니다");
    }

    @Test
    @DisplayName("비밀번호가 일치하지 않으면 UnauthorizedException을 던진다")
    void wrongPassword() {
      String email = "test@example.com";
      LocalLoginRequestDto dto = new LocalLoginRequestDto(
        email,
        "wrongPassword"
      );
      User user = new User(email, "encoded", "닉네임");

      when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
      when(passwordEncoder.matches(eq("wrongPassword"), any()))
        .thenReturn(false);

      assertThatThrownBy(() -> authService.localLogin(dto))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessageContaining("비밀번호가 일치하지 않습니다");
    }
  }
}
