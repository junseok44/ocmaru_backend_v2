package com.junseok.ocmaru.domain.auth.dto;

import com.junseok.ocmaru.domain.user.User;

public record AuthTokenResponse(
  Long id,
  String email,
  String displayName,
  boolean admin,
  String accessToken,
  String refreshToken,
  String tokenType,
  long accessTokenExpiresInSeconds,
  long refreshTokenExpiresInSeconds
) {
  public static AuthTokenResponse of(
    User user,
    String accessToken,
    String refreshToken,
    long accessTokenExpiresInSeconds,
    long refreshTokenExpiresInSeconds
  ) {
    return new AuthTokenResponse(
      user.getId(),
      user.getEmail(),
      user.getDisplayName(),
      user.isAdmin(),
      accessToken,
      refreshToken,
      "Bearer",
      accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds
    );
  }
}
