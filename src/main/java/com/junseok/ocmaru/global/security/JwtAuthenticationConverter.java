package com.junseok.ocmaru.global.security;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationConverter
  implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

  private final JwtTokenService jwtTokenService;

  public JwtAuthenticationConverter(JwtTokenService jwtTokenService) {
    this.jwtTokenService = jwtTokenService;
  }

  @Override
  public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
    AuthPrincipal principal = jwtTokenService.toPrincipal(jwt);
    List<SimpleGrantedAuthority> authorities = jwtTokenService
      .extractRoles(jwt)
      .stream()
      .map(SimpleGrantedAuthority::new)
      .toList();
    return new UsernamePasswordAuthenticationToken(principal, jwt.getTokenValue(), authorities);
  }
}
