package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpinionRepository
  extends JpaRepository<Opinion, Long>, OpinionRepositoryCustom {
  long countByCreatedAtGreaterThanEqual(LocalDateTime dateTime);

  long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

  long countByUserId(Long userId);

  @Query("select o.id from Opinion o where o.user.id = :userId")
  List<Long> findIdsByUserId(@Param("userId") Long userId);

  void deleteByUserId(Long userId);

  @Query("select o from Opinion o where o.opinionClusters IS EMPTY")
  List<Opinion> findAllUnclusteredOpinions();
}
