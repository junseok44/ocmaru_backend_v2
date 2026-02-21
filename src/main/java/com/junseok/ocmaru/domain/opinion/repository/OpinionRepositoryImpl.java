package com.junseok.ocmaru.domain.opinion.repository;

import static com.junseok.ocmaru.domain.opinion.entity.QOpinion.opinion;
import static com.junseok.ocmaru.domain.opinion.entity.QOpinionCluster.opinionCluster;
import static com.junseok.ocmaru.domain.opinion.entity.QOpinionLike.opinionLike;

import com.junseok.ocmaru.domain.opinion.dto.OpinionSearchCondition;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class OpinionRepositoryImpl implements OpinionRepositoryCustom {

  private final JPAQueryFactory queryFactory;

  @Override
  public List<Opinion> searchOpinions(
    OpinionSearchCondition cond,
    int offset,
    int limit
  ) {
    JPAQuery<Opinion> query = queryFactory.selectFrom(opinion);

    if (cond.withUser()) {
      query.leftJoin(opinion.user).fetchJoin();
    }

    if (cond.withCluster()) {
      query.leftJoin(opinion.opinionClusters, opinionCluster);
    }

    if (cond.likedByUserId() != null) {
      query.leftJoin(opinionLike).on(opinionLike.opinion.eq(opinion));
    }

    query.where(
      ownerEq(cond.ownerId()),
      unclusteredEq(cond.unclustered()),
      likedEq(cond.likedByUserId())
    );

    query.orderBy(opinion.createdAt.desc());

    query.offset(offset).limit(limit);

    return query.fetch();
  }

  private BooleanExpression ownerEq(Long ownerId) {
    return ownerId == null ? null : opinion.user.id.eq(ownerId);
  }

  private BooleanExpression unclusteredEq(boolean unclustered) {
    return unclustered ? opinion.opinionClusters.isEmpty() : null;
  }

  // 특정 user가 좋아요 한 opinion만 불러오기
  private BooleanExpression likedEq(Long likedUserId) {
    return likedUserId == null ? null : opinionLike.user.id.eq(likedUserId);
  }
}
