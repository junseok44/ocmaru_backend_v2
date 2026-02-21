package com.junseok.ocmaru.domain.opinion.dto;

/**
 * PATCH 시 null이 아닌 필드만 수정 대상.
 */
public record OpinionUpdateRequestDto(String content, String voiceUrl) {}
