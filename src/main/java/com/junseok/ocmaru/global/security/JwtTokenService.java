package com.junseok.ocmaru.global.security;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.user.User;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

  public static final String TOKEN_TYPE_ACCESS = "access";
  public static final String TOKEN_TYPE_REFRESH = "refresh";

  private final JwtEncoder jwtEncoder;
  private final JwtDecoder jwtDecoder;
  private final long accessTokenExpiresInSeconds;
  private final long refreshTokenExpiresInSeconds;

  public JwtTokenService(
    JwtEncoder jwtEncoder,
    JwtDecoder jwtDecoder,
    @Value("${app.jwt.access-token-exp-seconds:3600}") long accessTokenExpiresInSeconds,
    @Value("${app.jwt.refresh-token-exp-seconds:1209600}") long refreshTokenExpiresInSeconds
  ) {
    this.jwtEncoder = jwtEncoder;
    this.jwtDecoder = jwtDecoder;
    this.accessTokenExpiresInSeconds = accessTokenExpiresInSeconds;
    this.refreshTokenExpiresInSeconds = refreshTokenExpiresInSeconds;
  }

  public String createAccessToken(User user) {
    return createToken(user, TOKEN_TYPE_ACCESS, accessTokenExpiresInSeconds);
  }

  public String createRefreshToken(User user) {
    return createToken(user, TOKEN_TYPE_REFRESH, refreshTokenExpiresInSeconds);
  }

  public Jwt decode(String token) {
    return jwtDecoder.decode(token);
  }

  public AuthPrincipal toPrincipal(Jwt jwt) {
    Long userId = parseUserId(jwt.getSubject());
    String email = jwt.getClaimAsString("email");
    String displayName = jwt.getClaimAsString("displayName");
    return new AuthPrincipal(userId, email, displayName);
  }

  public List<String> extractRoles(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList("roles");
    return roles == null ? List.of() : roles;
  }

  public long getAccessTokenExpiresInSeconds() {
    return accessTokenExpiresInSeconds;
  }

  public long getRefreshTokenExpiresInSeconds() {
    return refreshTokenExpiresInSeconds;
  }

  private String createToken(User user, String tokenType, long expireSeconds) {
    Instant now = Instant.now();
    JwtClaimsSet claims = JwtClaimsSet
      .builder()
      .issuer("ocmaru")
      .issuedAt(now)
      .expiresAt(now.plusSeconds(expireSeconds))
      .subject(String.valueOf(user.getId()))
      .claim("email", user.getEmail())
      .claim("displayName", user.getDisplayName())
      .claim("tokenType", tokenType)
      .claim(
        "roles",
        user.isAdmin() ? List.of("ROLE_USER", "ROLE_ADMIN") : List.of("ROLE_USER")
      )
      .build();
    return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }

  private Long parseUserId(String value) {
    try {
      return Long.valueOf(value);
    } catch (Exception e) {
      throw new IllegalArgumentException("유효하지 않은 토큰 subject입니다.");
    }
  }
}
