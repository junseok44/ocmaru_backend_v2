package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.user.dto.UserListItemDto;
import com.junseok.ocmaru.domain.user.dto.UserStatsResponseDto;
import com.junseok.ocmaru.domain.user.dto.UserUpdateRequestDto;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UsersController {

  private final UserService userService;

  @GetMapping("/me/stats")
  public ResponseEntity<UserStatsResponseDto> getMyStats(
    @CurrentUser AuthPrincipal user
  ) {
    return ResponseEntity.ok(userService.getMyStats(user.getId()));
  }

  @PatchMapping("/me")
  public ResponseEntity<UserDto> updateMe(
    @CurrentUser AuthPrincipal user,
    @RequestBody @Valid UserUpdateRequestDto dto
  ) {
    User updated = userService.updateUser(user.getId(), dto);
    return ResponseEntity.ok(UserDto.from(updated));
  }

  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteMe(@CurrentUser AuthPrincipal user) {
    userService.deleteUser(user.getId());
    return ResponseEntity.ok().build();
  }

  @GetMapping("")
  public ResponseEntity<List<UserListItemDto>> getUsers(
    @RequestParam(required = false) Integer limit,
    @RequestParam(required = false) Integer offset,
    @RequestParam(required = false) String search
  ) {
    return ResponseEntity.ok(userService.getUsers(limit, offset, search));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<UserDto> updateUser(
    @PathVariable Long id,
    @RequestBody @Valid UserUpdateRequestDto dto
  ) {
    User updated = userService.updateUser(id, dto);
    return ResponseEntity.ok(UserDto.from(updated));
  }
}
