package com.junseok.ocmaru.domain.opinion.dto;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.enums.OpinionType;
import java.time.LocalDateTime;

public record OpinionResponseDto(
  Long id,
  Long userId,
  OpinionUserDto user, // 또는 userId만 두고 프론트에서 따로 조회해도 됨
  OpinionType type,
  String content,
  String voiceUrl,
  Integer likes,
  Integer commentCount, // 댓글 수
  boolean likedByMe, // 내가 좋아요 했는지
  LocalDateTime createdAt
) {
  public static OpinionResponseDto toDto(
    Opinion op,
    int commentCount,
    boolean likedByMe
  ) {
    return new OpinionResponseDto(
      op.getId(),
      op.getUser().getId(),
      new OpinionUserDto(
        op.getUser().getId(),
        op.getUser().getEmail(),
        op.getUser().getDisplayName(),
        op.getUser().getAvatarUrl()
      ),
      op.getType(),
      op.getContent(),
      op.getVoiceUrl(),
      op.getLikes(),
      commentCount,
      likedByMe,
      op.getCreatedAt()
    );
  }
}
