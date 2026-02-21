package com.junseok.ocmaru.domain.opinion.projections;

public interface OpinionCommentCountProjection {
  Long getOpinionId();
  Integer getCnt();
}
