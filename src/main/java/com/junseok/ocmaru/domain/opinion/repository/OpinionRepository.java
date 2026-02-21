package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OpinionRepository
  extends JpaRepository<Opinion, Long>, OpinionRepositoryCustom {}
