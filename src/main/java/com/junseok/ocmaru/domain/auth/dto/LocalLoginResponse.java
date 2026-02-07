package com.junseok.ocmaru.domain.auth.dto;

import com.junseok.ocmaru.domain.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LocalLoginResponse {

  private Long id;
  private String email;
  private String displayName;
  private boolean admin;

  public static LocalLoginResponse from(User user) {
    return new LocalLoginResponse(
      user.getId(),
      user.getEmail(),
      user.getDisplayName(),
      user.isAdmin()
    );
  }
}
