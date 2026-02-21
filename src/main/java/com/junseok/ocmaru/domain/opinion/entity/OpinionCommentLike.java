package com.junseok.ocmaru.domain.opinion.entity;

import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
  uniqueConstraints = {
    @UniqueConstraint(columnNames = { "OPINION_COMMENT_ID", "USER_ID" }),
  }
)
@Getter
public class OpinionCommentLike extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "OPINION_COMMENT_ID")
  private OpinionComment opinionComment;

  @ManyToOne
  @JoinColumn(name = "USER_ID")
  private User user;

  public OpinionCommentLike(OpinionComment opinionComment, User user) {
    this.opinionComment = opinionComment;
    this.user = user;
  }
}
