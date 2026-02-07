package com.junseok.ocmaru.domain.auth;

import com.junseok.ocmaru.domain.auth.dto.LocalLoginRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalLoginResponse;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterRequestDto;
import com.junseok.ocmaru.domain.auth.dto.LocalRegisterResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register")
  public ResponseEntity<LocalRegisterResponse> register(
    @Valid @RequestBody LocalRegisterRequestDto dto
  ) {
    LocalRegisterResponse body = authService.localRegister(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(body);
  }

  @PostMapping("/login")
  public ResponseEntity<LocalLoginResponse> login(
    @Valid @RequestBody LocalLoginRequestDto dto
  ) {
    LocalLoginResponse body = authService.localLogin(dto);

    AuthPrincipal principal = AuthPrincipal.from(body);
    List<SimpleGrantedAuthority> authorities = body.isAdmin()
      ? List.of(
        new SimpleGrantedAuthority("ROLE_USER"),
        new SimpleGrantedAuthority("ROLE_ADMIN")
      )
      : List.of(new SimpleGrantedAuthority("ROLE_USER"));
    var auth = new UsernamePasswordAuthenticationToken(
      principal,
      null,
      authorities
    );
    SecurityContextHolder.getContext().setAuthentication(auth);

    return ResponseEntity.ok(body);
  }
}
