package com.junseok.ocmaru.domain.agenda.entity;

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
public class AgendaTimelineItem extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "AGENDA_ID", nullable = false)
  private Agenda agenda;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "USER_ID", nullable = false)
  private User user;

  @Column(nullable = false, length = 200)
  private String authorName = "작성자";

  @Column(nullable = false, length = 200)
  private String content;

  private String imageUrl;

  public AgendaTimelineItem(
    Agenda agenda,
    User user,
    String content,
    String imageUrl
  ) {
    this.agenda = agenda;
    this.user = user;
    this.content = content;
    this.imageUrl = imageUrl;
  }

  public void setAuthorName(String authorName) {
    if (authorName != null && !authorName.isBlank()) this.authorName = authorName;
  }

  public void updateContent(String content) {
    if (content == null || content.isBlank()) {
      throw new IllegalArgumentException("content는 비어있을 수 없습니다.");
    }
    this.content = content;
  }

  public void update(String authorName, String content, String imageUrl) {
    if (authorName != null && !authorName.isBlank()) this.authorName = authorName;
    if (content != null && !content.isBlank()) this.content = content;
    if (imageUrl != null) this.imageUrl = imageUrl;
  }
}
