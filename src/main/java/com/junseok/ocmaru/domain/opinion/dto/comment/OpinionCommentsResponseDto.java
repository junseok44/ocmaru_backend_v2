package com.junseok.ocmaru.domain.opinion.dto.comment;

import java.util.List;

public record OpinionCommentsResponseDto(
  List<OpinionCommentResponseDto> comments
) {}
