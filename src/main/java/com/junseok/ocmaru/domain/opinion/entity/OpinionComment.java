package com.junseok.ocmaru.domain.opinion.entity;

import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpinionComment extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "OPINION_ID")
  private Opinion opinion;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "USER_ID")
  private User user;

  @Column(nullable = false)
  private String content;

  public OpinionComment(Opinion opinion, User user, String content) {
    this.opinion = opinion;
    this.user = user;
    this.content = content;
  }

  public void updateContent(String content) {
    if (content == null || content.isBlank()) {
      throw new IllegalArgumentException("content는 비어있을 수 없습니다.");
    }
    this.content = content;
  }
}
