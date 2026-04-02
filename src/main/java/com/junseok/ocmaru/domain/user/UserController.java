package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
@Tag(name = "사용자", description = "회원 프로필 (/user)")
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  public ResponseEntity<UserDto> me(@CurrentUser AuthPrincipal principal) {
    User user = userService.findById(principal.getId());
    return ResponseEntity.ok(UserDto.from(user));
  }
}
