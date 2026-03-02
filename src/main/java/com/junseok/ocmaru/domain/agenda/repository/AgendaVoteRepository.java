package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVotes;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendaVoteRepository
  extends JpaRepository<AgendaVotes, Long> {
  List<AgendaVotes> findByAgendaId(Long agendaId);

  long countByAgendaIdAndVoteType(Long agendaId, AgendaVoteType voteType);

  Optional<AgendaVotes> findByAgendaIdAndUserId(Long agendaId, Long userId);

  void deleteByAgendaIdAndUserId(Long agendaId, Long userId);
}
