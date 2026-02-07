package com.junseok.ocmaru.domain.auth.dto;

import com.junseok.ocmaru.domain.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LocalRegisterResponse {

  private Long id;
  private String email;
  private String displayName;

  public static LocalRegisterResponse from(User user) {
    return new LocalRegisterResponse(
      user.getId(),
      user.getEmail(),
      user.getDisplayName()
    );
  }
}
