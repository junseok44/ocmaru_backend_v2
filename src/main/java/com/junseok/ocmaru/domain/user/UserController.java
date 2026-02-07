package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

  private final UserService userService;

  @GetMapping("/me")
  public ResponseEntity<UserDto> me(@CurrentUser AuthPrincipal principal) {
    User user = userService.findById(principal.getId());
    return ResponseEntity.ok(UserDto.from(user));
  }
}
