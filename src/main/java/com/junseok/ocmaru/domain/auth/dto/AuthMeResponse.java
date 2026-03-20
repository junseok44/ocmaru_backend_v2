package com.junseok.ocmaru.domain.auth.dto;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AuthMeResponse {

  private Long id;
  private String email;
  private String displayName;
  private boolean admin;

  public static AuthMeResponse from(AuthPrincipal principal) {
    return new AuthMeResponse(
      principal.getId(),
      principal.getEmail(),
      principal.getDisplayName(),
      principal.isAdmin()
    );
  }
}
