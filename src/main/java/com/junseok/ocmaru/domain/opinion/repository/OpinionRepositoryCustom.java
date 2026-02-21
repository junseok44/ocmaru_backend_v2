package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.dto.OpinionSearchCondition;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import java.util.List;

public interface OpinionRepositoryCustom {
  // OpinionRepositoryCustom에 하나의 메서드만 선언한다고 가정
  List<Opinion> searchOpinions(
    OpinionSearchCondition cond,
    int offset,
    int limit
  );
  // Optional<Opinion> findByIdWithUser(Long id);
}
