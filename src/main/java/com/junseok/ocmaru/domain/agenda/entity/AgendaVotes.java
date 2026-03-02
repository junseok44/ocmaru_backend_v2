package com.junseok.ocmaru.domain.agenda.entity;

import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
  uniqueConstraints = {
    @UniqueConstraint(columnNames = { "AGENDA_ID", "USER_ID", "VOTE_TYPE" }),
  }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AgendaVotes extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "AGENDA_ID", nullable = false)
  private Agenda agenda;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "USER_ID", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AgendaVoteType voteType;

  public AgendaVotes(Agenda agenda, User user, AgendaVoteType voteType) {
    this.agenda = agenda;
    this.user = user;
    this.voteType = voteType;
  }
}
