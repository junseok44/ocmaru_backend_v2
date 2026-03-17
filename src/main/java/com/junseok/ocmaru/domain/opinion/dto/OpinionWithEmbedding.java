package com.junseok.ocmaru.domain.opinion.dto;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import lombok.Getter;

@Getter
public class OpinionWithEmbedding {

  private Opinion opinion;
  private Number[] embedding;

  public OpinionWithEmbedding(Opinion opinion, Number[] embedding) {
    this.opinion = opinion;
    this.embedding = embedding;
  }
}
