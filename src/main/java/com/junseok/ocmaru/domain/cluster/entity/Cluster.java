package com.junseok.ocmaru.domain.cluster.entity;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.cluster.dto.ClusterUpdateRequestDto;
import com.junseok.ocmaru.domain.cluster.enums.ClusterStatus;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;

@Entity
public class Cluster extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "AGENDA_ID")
  @Getter
  private Agenda agenda;

  @Column(nullable = false)
  @Getter
  private String title;

  @Column(nullable = false)
  @Getter
  private String summary;

  @Enumerated
  @Getter
  private ClusterStatus clusterStatus = ClusterStatus.PENDING;

  @Column(nullable = false)
  @Getter
  private Integer opinionCount = 0;

  @Getter
  private Integer similarity;

  @ElementCollection
  @CollectionTable(joinColumns = @JoinColumn(name = "agenda_id"))
  @Getter
  private List<String> tags = new ArrayList<>();

  public Cluster(
    String title,
    String summary,
    Integer similarity,
    Integer opinionCount
  ) {
    this.title = title;
    this.summary = summary;
    this.similarity = similarity;
    this.opinionCount = opinionCount;
  }

  public void update(ClusterUpdateRequestDto dto) {
    if (dto.title() != null) {
      this.title = dto.title();
    }
    if (dto.summary() != null) {
      this.summary = dto.summary();
    }
  }
}
