package com.junseok.ocmaru.domain.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

  private Long id;
  private String email;
  private String displayName;

  public static UserDto from(User user) {
    return new UserDto(user.getId(), user.getEmail(), user.getDisplayName());
  }
}
