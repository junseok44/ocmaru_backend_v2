package com.junseok.ocmaru.domain.agenda.entity;

import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(
  uniqueConstraints = {
    @UniqueConstraint(columnNames = { "AGENDA_ID", "USER_ID" }),
  }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AgendaBookmark extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "AGENDA_ID")
  private Agenda agenda;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "USER_ID")
  private User user;

  public AgendaBookmark(Agenda agenda, User user) {
    this.agenda = agenda;
    this.user = user;
  }
}
