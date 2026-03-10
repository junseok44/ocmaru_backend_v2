package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.AuthMeResponse;
import com.junseok.ocmaru.domain.auth.dto.AuthProvidersResponse;
import com.junseok.ocmaru.domain.auth.dto.AuthTokenResponse;
import com.junseok.ocmaru.domain.auth.dto.LocalLoginRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterResponse;
import com.junseok.ocmaru.domain.auth.dto.TokenRefreshRequestDto;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import com.junseok.ocmaru.global.config.OAuthProperties;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final OAuthProperties oAuthProperties;

  /** 로그인된 사용자 정보 (미인증 시 401). */
  @GetMapping("/me")
  public ResponseEntity<AuthMeResponse> me(
    @CurrentUser AuthPrincipal principal
  ) {
    return ResponseEntity.ok(AuthMeResponse.from(principal));
  }

  /** 사용 가능한 OAuth 제공자 (google, kakao) 활성화 여부. */
  @GetMapping("/providers")
  public ResponseEntity<AuthProvidersResponse> providers() {
    return ResponseEntity.ok(
      new AuthProvidersResponse(
        oAuthProperties.isGoogleEnabled(),
        oAuthProperties.isKakaoEnabled()
      )
    );
  }

  /** Google OAuth 시작 (활성화된 경우에만). */
  @GetMapping("/google")
  public ResponseEntity<Void> google(UriComponentsBuilder uriBuilder) {
    if (!oAuthProperties.isGoogleEnabled()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity
      .status(HttpStatus.FOUND)
      .location(uriBuilder.path("/oauth2/authorization/google").build().toUri())
      .build();
  }

  /** Kakao OAuth 시작 (활성화된 경우에만). */
  @GetMapping("/kakao")
  public ResponseEntity<Void> kakao(UriComponentsBuilder uriBuilder) {
    if (!oAuthProperties.isKakaoEnabled()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity
      .status(HttpStatus.FOUND)
      .location(uriBuilder.path("/oauth2/authorization/kakao").build().toUri())
      .build();
  }

  @PostMapping("/register")
  public ResponseEntity<LocalRegisterResponse> register(
    @Valid @RequestBody LocalRegisterRequestDto dto
  ) {
    LocalRegisterResponse body = authService.localRegister(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(body);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthTokenResponse> login(
    @Valid @RequestBody LocalLoginRequestDto dto
  ) {
    AuthTokenResponse body = authService.localLogin(dto);
    return ResponseEntity.ok(body);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthTokenResponse> refresh(
    @Valid @RequestBody TokenRefreshRequestDto dto
  ) {
    AuthTokenResponse body = authService.refresh(dto.refreshToken());
    return ResponseEntity.ok(body);
  }
}
