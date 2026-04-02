package com.junseok.ocmaru.domain.cluster.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.junseok.ocmaru.domain.agenda.dto.AgendaResponseDto;
import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;

/**
 * Cluster + Agenda (1:1 대응) 응답.
 * ClusterResponseDto 필드는 펼쳐지고, agenda는 별도 키로 포함.
 * agenda는 호출 측에서 fetch 후 인자로 넘긴다 (lazy 미발동).
 */
public record ClusterWithAgendaDto(
  @JsonUnwrapped ClusterResponseDto cluster,
  AgendaResponseDto agenda
) {
  public static ClusterWithAgendaDto from(Cluster cluster, Agenda agenda) {
    if (cluster == null) {
      return null;
    }
    return from(cluster, agenda, agenda.getVoteCount());
  }

  public static ClusterWithAgendaDto from(
    Cluster cluster,
    Agenda agenda,
    int voteCount
  ) {
    if (cluster == null) {
      return null;
    }
    return new ClusterWithAgendaDto(
      ClusterResponseDto.from(cluster),
      AgendaResponseDto.from(agenda, voteCount)
    );
  }
}
