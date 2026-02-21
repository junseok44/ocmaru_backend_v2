package com.junseok.ocmaru.domain.opinion.dto;

// 예시용 검색 조건 DTO
public record OpinionSearchCondition(
  Long ownerId, // 내 의견만 (opinions.userId = ?)
  Long likedByUserId, // 내가 좋아요 누른 의견만
  boolean unclustered, // 클러스터 미배정 (opinionClusters.id is null)
  boolean withUser,
  boolean withCluster
) {}
