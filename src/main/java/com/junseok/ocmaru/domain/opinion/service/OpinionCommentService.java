package com.junseok.ocmaru.domain.opinion.service;

import com.junseok.ocmaru.domain.opinion.dto.OpinionUserDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentUpdateRequestDto;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.entity.OpinionComment;
import com.junseok.ocmaru.domain.opinion.entity.OpinionCommentLike;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OpinionCommentService {

  private final OpinionCommentRepository opinionCommentRepository;

  private final OpinionRepository opinionRepository;
  private final UserRepository userRepository;
  private final OpinionCommentLikeRepository opinionCommentLikeRepository;

  public List<OpinionCommentResponseDto> getOpinionComments(Long opinionId) {
    List<OpinionComment> comments = opinionCommentRepository.getOpinionCommentsWithUser(
      opinionId
    );

    return comments
      .stream()
      .map(c ->
        new OpinionCommentResponseDto(
          OpinionUserDto.fromDto(c.getUser()),
          c.getContent()
        )
      )
      .toList();
  }

  public Long createOpinionComments(
    OpinionCommentCreateRequestDto dto,
    Long opinionId,
    Long userId
  ) {
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("해당 유저가 존재하지 않습니다.")
      );
    Opinion opinion = opinionRepository
      .findById(opinionId)
      .orElseThrow(() ->
        new NotFoundException("해당 opinion이 존재하지 않습니다")
      );

    OpinionComment opinionComment = new OpinionComment(
      opinion,
      user,
      dto.content()
    );

    OpinionComment savedComment = opinionCommentRepository.save(opinionComment);

    return savedComment.getId();
  }

  public void updateOpinionComment(
    Long commentId,
    OpinionCommentUpdateRequestDto dto,
    Long userId
  ) {
    OpinionComment comment = opinionCommentRepository
      .findById(commentId)
      .orElseThrow(() -> new NotFoundException("해당 댓글이 존재하지 않습니다.")
      );

    if (!comment.getUser().getId().equals(userId)) {
      throw new UnauthorizedException("해당 댓글의 주인이 아닙니다.");
    }

    comment.updateContent(dto.content());

    opinionCommentRepository.save(comment);
  }

  public void deleteOpinionComment(Long commentId, Long userId) {
    OpinionComment comment = opinionCommentRepository
      .findById(commentId)
      .orElseThrow(() -> new NotFoundException("해당 댓글이 존재하지 않습니다.")
      );

    if (!comment.getUser().getId().equals(userId)) {
      throw new UnauthorizedException("해당 댓글의 주인이 아닙니다.");
    }

    opinionCommentRepository.deleteById(commentId);
  }

  public void likeOpinionComment(Long commentId, Long userId) {
    OpinionComment comment = opinionCommentRepository
      .findById(commentId)
      .orElseThrow(() -> new NotFoundException("해당 댓글이 존재하지 않습니다.")
      );

    Optional<OpinionCommentLike> prevOpinionCommentLike = opinionCommentLikeRepository.findByOpinionCommentIdAndUserId(
      commentId,
      userId
    );

    if (prevOpinionCommentLike.isPresent()) {
      throw new IllegalStateException("이미 좋아요한 댓글입니다.");
    }

    User user = userRepository.getReferenceById(userId);

    opinionCommentLikeRepository.save(new OpinionCommentLike(comment, user));
  }

  public void unlikeOpinionComment(Long commentId, Long userId) {
    OpinionCommentLike opinionCommentLike = opinionCommentLikeRepository
      .findByOpinionCommentIdAndUserId(commentId, userId)
      .orElseThrow(() ->
        new NotFoundException("해당 댓글의 좋아요 기록이 없습니다.")
      );

    opinionCommentLikeRepository.delete(opinionCommentLike);
  }
}
