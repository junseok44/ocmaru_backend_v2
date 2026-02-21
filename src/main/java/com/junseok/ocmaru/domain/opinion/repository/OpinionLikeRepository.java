package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.OpinionLike;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpinionLikeRepository
  extends JpaRepository<OpinionLike, Long> {
  @Query(
    "select op.id from OpinionLike ol join ol.user user join ol.opinion op where user.id = :userId and op.id in :opinionIds"
  )
  public Set<Long> getUserLikedOpinionIdsIn(
    @Param("userId") Long userId,
    @Param("opinionIds") List<Long> opinionIds
  );

  @Query(
    "select ol from OpinionLike ol where ol.opinion.id = :opinionId and ol.user.id = :userId"
  )
  Optional<OpinionLike> findByOpinionIdAndUserId(
    @Param("opinionId") Long opinionId,
    @Param("userId") Long userId
  );
}
