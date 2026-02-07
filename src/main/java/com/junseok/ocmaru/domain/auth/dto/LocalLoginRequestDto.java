package com.junseok.ocmaru.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public class LocalLoginRequestDto {

  @NotBlank
  @Email
  private final String email;

  @NotBlank
  private final String password;
}
