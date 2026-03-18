package com.junseok.ocmaru.domain.opinion.service;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.entity.OpinionLike;
import com.junseok.ocmaru.domain.opinion.repository.OpinionLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OpinionLikeService {

  private final OpinionLikeRepository opinionLikeRepository;
  private final UserRepository userRepository;
  private final OpinionRepository opinionRepository;

  @Transactional
  public void likeOpinion(Long userId, Long opinionId) {
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("해당 유저가 존재하지 않습니다.")
      );

    Opinion opinion = opinionRepository
      .findById(opinionId)
      .orElseThrow(() ->
        new NotFoundException("해당 opinion이 존재하지 않습니다.")
      );

    Optional<OpinionLike> prev = opinionLikeRepository.findByOpinionIdAndUserId(
      opinionId,
      userId
    );

    if (prev.isPresent()) {
      throw new IllegalStateException("이미 좋아요한 의견입니다.");
    }
    opinion.increaseLikes();
    opinionRepository.save(opinion);
    opinionLikeRepository.save(new OpinionLike(opinion, user));
  }

  @Transactional
  public void unlikeOpinion(Long userId, Long opinionId) {
    OpinionLike opinionLike = opinionLikeRepository
      .findByOpinionIdAndUserId(opinionId, userId)
      .orElseThrow(() -> new NotFoundException("좋아요 기록이 없습니다."));

    opinionLike.getOpinion().decreaseLikes();
    opinionLikeRepository.delete(opinionLike);
  }

  public boolean getIsLikedForOpinion(Long userId, Long opinionId) {
    Optional<OpinionLike> opinionLike = opinionLikeRepository.findByOpinionIdAndUserId(
      opinionId,
      userId
    );

    return opinionLike.isPresent() ? true : false;
  }
}
