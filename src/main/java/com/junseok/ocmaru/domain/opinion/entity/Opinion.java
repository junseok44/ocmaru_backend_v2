package com.junseok.ocmaru.domain.opinion.entity;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.opinion.enums.OpinionType;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Opinion extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "USER_ID", nullable = false)
  @Getter
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "CLUSTER_ID")
  private Cluster cluster;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OpinionType type = OpinionType.TEXT;

  @Column(nullable = false)
  @Getter
  private String content;

  @Getter
  private String voiceUrl;

  @Column(nullable = false)
  private Integer likes = 0;

  public Opinion(User user, String content) {
    this.user = user;
    this.content = content;
  }

  public Opinion(User user, OpinionType type, String content, String voiceUrl) {
    this.user = user;
    this.type = type;
    this.content = content;
    this.voiceUrl = voiceUrl;
  }
}
