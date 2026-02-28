package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.entity.AgendaTimelineItem;

public record ExecutionTimelineResponseDto(
  Long id,
  String content,
  String imageUrl
) {
  public static ExecutionTimelineResponseDto from(AgendaTimelineItem item) {
    return new ExecutionTimelineResponseDto(
      item.getId(),
      item.getContent(),
      item.getImageUrl()
    );
  }
}
