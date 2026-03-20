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
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
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
    this.agendaReferences = new AgendaReferences();
  }

  public void updateTitleAndDescription(String title, String description) {
    if (title != null) this.title = title;
    if (description != null) this.description = description;
  }

  public void updateReferences(
    java.util.List<String> referenceLinks,
    java.util.List<String> referenceFiles,
    String okinewsUrl,
    java.util.List<String> regionalCases
  ) {
    if (this.agendaReferences == null) this.agendaReferences =
      new AgendaReferences();
    if (referenceLinks != null) this.agendaReferences.setReferenceLinks(
        referenceLinks
      );
    if (referenceFiles != null) this.agendaReferences.setReferenceFiles(
        referenceFiles
      );
    if (okinewsUrl != null) this.agendaReferences.setOkinewsUrl(okinewsUrl);
    if (regionalCases != null)
      this.agendaReferences.setRegionalCases(regionalCases);
  }

  public void setAgendaStatus(AgendaStatus agendaStatus) {
    if (agendaStatus != null) {
      this.agendaStatus = agendaStatus;
    }
  }

  public void setThumbnail(String thumbnail) {
    this.thumbnail = thumbnail;
  }

  public void increaseVoteCount(int delta) {
    if (delta <= 0) return;
    this.voteCount = (this.voteCount != null ? this.voteCount : 0) + delta;
  }

  public void increaseViewCount(int delta) {
    if (delta <= 0) return;
    this.viewCount = (this.viewCount != null ? this.viewCount : 0) + delta;
  }

  public void appendReferenceFile(String fileUrl) {
    if (this.agendaReferences == null) this.agendaReferences =
      new AgendaReferences();
    this.agendaReferences.addReferenceFile(fileUrl);
  }
}
