package com.junseok.ocmaru.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AuthProvidersResponse {

  private boolean google;
  private boolean kakao;
}
