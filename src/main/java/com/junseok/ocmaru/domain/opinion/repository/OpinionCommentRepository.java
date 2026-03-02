package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.OpinionComment;
import com.junseok.ocmaru.domain.opinion.projections.OpinionCommentCountProjection;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpinionCommentRepository
  extends JpaRepository<OpinionComment, Long> {
  @Query(
    "select op.id as opinionId, count(*) as cnt from OpinionComment oc join oc.opinion op where op.id in :opinionIds group by op.id"
  )
  public List<OpinionCommentCountProjection> getOpinionCommentCount(
    @Param("opinionIds") List<Long> opinionIds
  );

  @Query("select oc OpinionComment oc join fetch oc.user user")
  public List<OpinionComment> getOpinionCommentsWithUser(
    @Param("opinionId") Long opinionId
  );

  @Query("select oc.id from OpinionComment oc where oc.user.id = :userId")
  List<Long> findIdsByUserId(@Param("userId") Long userId);

  @Query(
    "select count(oc) from OpinionComment oc join oc.opinion o join o.opinionClusters c where c.cluster.agenda.id = :agendaId"
  )
  long countByAgendaId(@Param("agendaId") Long agendaId);

  void deleteByUserId(Long userId);
}
