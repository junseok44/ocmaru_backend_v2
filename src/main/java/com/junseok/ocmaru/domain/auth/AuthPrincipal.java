package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.LocalLoginResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인된 사용자 정보. SecurityContext의 Authentication principal로 사용.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AuthPrincipal {

  private Long id;
  private String email;
  private String displayName;

  public static AuthPrincipal from(LocalLoginResponse response) {
    return new AuthPrincipal(
      response.getId(),
      response.getEmail(),
      response.getDisplayName()
    );
  }
}
