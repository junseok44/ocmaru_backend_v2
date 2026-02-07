package com.junseok.ocmaru.domain.agenda.entity;

import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Agenda extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "WRITER_ID")
  private User writer;

  @Column(nullable = false)
  private String title;

  @Column(length = 200, nullable = false)
  private String description;

  @Enumerated(EnumType.STRING)
  private AgendaStatus agendaStatus = AgendaStatus.CREATED;

  @Column(nullable = false)
  private Integer voteCount = 0;

  @Column(nullable = false)
  private Integer viewCount = 0;

  private String thumbnail;

  @Embedded
  private AgendaReferences agendaReferences;

  public Agenda(String title, String description, User writer) {
    this.title = title;
    this.description = description;
    this.writer = writer;
  }
}
