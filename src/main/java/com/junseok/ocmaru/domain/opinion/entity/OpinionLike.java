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
@Getter
@Table(
  uniqueConstraints = {
    @UniqueConstraint(columnNames = { "OPINION_ID", "USER_ID" }),
  }
)
public class OpinionLike extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "OPINION_ID")
  private Opinion opinion;

  @ManyToOne
  @JoinColumn(name = "USER_ID")
  private User user;

  public OpinionLike(Opinion opinion, User user) {
    this.opinion = opinion;
    this.user = user;
  }
}
