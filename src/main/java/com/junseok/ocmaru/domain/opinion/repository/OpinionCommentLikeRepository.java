package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.OpinionCommentLike;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpinionCommentLikeRepository
  extends JpaRepository<OpinionCommentLike, Long> {
  @Query(
    "select oc from OpinionCommentLike oc where oc.opinionComment.id = :commentId and oc.user.id = :userId"
  )
  Optional<OpinionCommentLike> findByOpinionCommentIdAndUserId(
    @Param("commentId") Long commentId,
    @Param("userId") Long userId
  );
}
