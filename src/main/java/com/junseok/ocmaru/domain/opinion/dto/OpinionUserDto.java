package com.junseok.ocmaru.domain.opinion.dto;

import com.junseok.ocmaru.domain.user.User;

public record OpinionUserDto(
  Long id,
  String username,
  String displayName,
  String avatarUrl
) {
  public static OpinionUserDto fromDto(User user) {
    return new OpinionUserDto(
      user.getId(),
      user.getDisplayName(),
      user.getDisplayName(),
      user.getAvatarUrl()
    );
  }
}
