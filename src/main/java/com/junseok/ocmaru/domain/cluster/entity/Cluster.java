package com.junseok.ocmaru.domain.cluster.entity;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.cluster.enums.ClusterStatus;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;

@Entity
public class Cluster extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "AGENDA_ID")
  @Getter
  private Agenda agenda;

  @OneToMany(mappedBy = "cluster")
  @Getter
  private List<Opinion> opinions = new ArrayList<>();

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
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
    List<Opinion> opinions,
    String title,
    String summary,
    Integer similarity
  ) {
    this.opinions = opinions;
    this.title = title;
    this.summary = summary;
    this.similarity = similarity;
  }
}
