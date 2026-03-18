package com.junseok.ocmaru.domain.opinion.entity;

import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.opinion.dto.OpinionUpdateRequestDto;
import com.junseok.ocmaru.domain.opinion.enums.OpinionType;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
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

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Getter
  private OpinionType type = OpinionType.TEXT;

  @OneToMany(
    mappedBy = "opinion",
    cascade = CascadeType.ALL,
    orphanRemoval = true
  )
  private List<OpinionCluster> opinionClusters = new ArrayList<>();

  @Column(nullable = false)
  @Getter
  private String content;

  @Getter
  private String voiceUrl;

  @Column(nullable = false)
  @Getter
  private Integer likes = 0;

  public Opinion(User user, String content) {
    this.user = user;
    this.content = content;
    this.type = OpinionType.TEXT;
  }

  public Opinion(User user, String content, String voiceUrl) {
    this.user = user;
    this.content = content;
    this.voiceUrl = voiceUrl;
    this.type = OpinionType.VOICE;
  }

  public List<Cluster> getClusters() {
    return this.opinionClusters.stream().map(c -> c.getCluster()).toList();
  }

  public void addCluster(Cluster cluster) {
    opinionClusters.add(new OpinionCluster(cluster, this));
  }

  public void removeCluster(Cluster cluster) {
    opinionClusters.removeIf(c -> c.getCluster().getId().equals(cluster.getId())
    );
  }

  public void increaseLikes() {
    this.likes = this.likes + 1;
  }

  public void decreaseLikes() {
    this.likes = Math.max(0, this.likes - 1);
  }

  /** PATCH용: DTO에 null이 아닌 필드만 반영 */
  public void applyUpdate(OpinionUpdateRequestDto dto) {
    if (dto.content() != null) {
      this.content = dto.content();
    }
    if (dto.voiceUrl() != null) {
      this.voiceUrl = dto.voiceUrl();
    }
  }
}
