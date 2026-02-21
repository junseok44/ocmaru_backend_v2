package com.junseok.ocmaru.domain.opinion.dto.comment;

import com.junseok.ocmaru.domain.opinion.dto.OpinionUserDto;

public record OpinionCommentResponseDto(OpinionUserDto user, String content) {}
