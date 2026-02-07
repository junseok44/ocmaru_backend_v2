package com.junseok.ocmaru.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class LocalRegisterRequestDto {

  @NotBlank
  @Size(min = 3, max = 50)
  private final String username;

  @NotBlank
  @Email
  private final String email;

  @NotBlank
  @Size(min = 6)
  private final String password;
}
