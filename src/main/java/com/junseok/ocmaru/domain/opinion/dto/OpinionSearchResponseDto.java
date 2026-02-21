package com.junseok.ocmaru.domain.opinion.dto;

import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class OpinionSearchResponseDto {

  public final List<OpinionResponseDto> opinions;
}
