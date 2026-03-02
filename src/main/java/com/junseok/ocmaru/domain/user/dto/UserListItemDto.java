package com.junseok.ocmaru.domain.user.dto;

import com.junseok.ocmaru.domain.user.User;
import java.time.LocalDateTime;

public record UserListItemDto(
  Long id,
  String email,
  String displayName,
  String avatarUrl,
  LocalDateTime createdAt
) {
  public static UserListItemDto from(User user) {
    return new UserListItemDto(
      user.getId(),
      user.getEmail(),
      user.getDisplayName(),
      user.getAvatarUrl(),
      user.getCreatedAt()
    );
  }
}
