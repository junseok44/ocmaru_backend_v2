package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.LocalLoginRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterResponse;
import com.junseok.ocmaru.domain.auth.dto.AuthTokenResponse;
import com.junseok.ocmaru.global.security.JwtTokenService;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;

  public LocalRegisterResponse localRegister(LocalRegisterRequestDto dto) {
    String encodedPassword = passwordEncoder.encode(dto.getPassword());
    User user = new User(dto.getEmail(), encodedPassword, dto.getUsername());
    User saved = userRepository.save(user);
    return LocalRegisterResponse.from(saved);
  }

  public AuthTokenResponse localLogin(LocalLoginRequestDto dto) {
    User findUser = authenticateLocalUser(dto);
    return issueTokens(findUser);
  }

  public AuthTokenResponse refresh(String refreshToken) {
    try {
      Jwt jwt = jwtTokenService.decode(refreshToken);
      String tokenType = jwt.getClaimAsString("tokenType");
      if (!JwtTokenService.TOKEN_TYPE_REFRESH.equals(tokenType)) {
        throw new UnauthorizedException("refresh token이 아닙니다.");
      }

      Long userId = Long.valueOf(jwt.getSubject());
      User user = userRepository
        .findById(userId)
        .orElseThrow(() -> new UnauthorizedException("유효하지 않은 refresh token입니다."));
      return issueAccessTokenOnly(user, refreshToken, jwt);
    } catch (Exception e) {
      throw new UnauthorizedException("유효하지 않은 refresh token입니다.");
    }
  }

  private User authenticateLocalUser(LocalLoginRequestDto dto) {
    User findUser = userRepository
      .findByEmail(dto.getEmail())
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));

    if (!findUser.matchesPassword(passwordEncoder, dto.getPassword())) {
      throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");
    }
    return findUser;
  }

  public AuthTokenResponse issueTokens(User user) {
    String accessToken = jwtTokenService.createAccessToken(user);
    String refreshToken = jwtTokenService.createRefreshToken(user);
    return AuthTokenResponse.of(
      user,
      accessToken,
      refreshToken,
      jwtTokenService.getAccessTokenExpiresInSeconds(),
      jwtTokenService.getRefreshTokenExpiresInSeconds()
    );
  }

  private AuthTokenResponse issueAccessTokenOnly(
    User user,
    String currentRefreshToken,
    Jwt refreshJwt
  ) {
    String accessToken = jwtTokenService.createAccessToken(user);
    long remainingRefreshSeconds = 0L;
    Instant expiresAt = refreshJwt.getExpiresAt();
    if (expiresAt != null) {
      remainingRefreshSeconds = Math.max(
        0L,
        expiresAt.getEpochSecond() - Instant.now().getEpochSecond()
      );
    }
    return AuthTokenResponse.of(
      user,
      accessToken,
      currentRefreshToken,
      jwtTokenService.getAccessTokenExpiresInSeconds(),
      remainingRefreshSeconds
    );
  }
}
