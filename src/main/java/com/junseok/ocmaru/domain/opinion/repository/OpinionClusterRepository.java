package com.junseok.ocmaru.domain.opinion.repository;

import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.entity.OpinionCluster;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OpinionClusterRepository
  extends JpaRepository<OpinionCluster, Long> {
  @Modifying(clearAutomatically = true)
  @Query("delete from OpinionCluster oc where oc.cluster.id in :clusterIds")
  void deleteAllByClusterIdIn(@Param("clusterIds") List<Long> clusterIds);

  /** 해당 안건에 속한 클러스터에 매달린 opinion_cluster 행 전부 삭제 (cluster 삭제 전) */
  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM OpinionCluster oc WHERE oc.cluster.agenda.id = :agendaId")
  void deleteAllByClusterAgendaId(@Param("agendaId") Long agendaId);

  @Query(
    "select op from OpinionCluster oc join oc.opinion op join op.user where oc.cluster.id = :clusterId"
  )
  List<Opinion> findOpinionsWithUserByClusterId(
    @Param("clusterId") Long clusterId
  );

  void deleteByOpinionIdIn(List<Long> opinionIds);
}
