package com.junseok.ocmaru.domain.agenda.dto;

import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;

/** 특정 사용자가 특정 아젠다에 투표한 결과 (1인 1투표) */
public record AgendaVoteResponseDto(AgendaVoteType voteType) {}
