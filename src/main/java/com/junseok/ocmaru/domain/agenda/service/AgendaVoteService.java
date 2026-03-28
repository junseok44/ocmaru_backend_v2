package com.junseok.ocmaru.domain.agenda.service;

import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteStatResponseDto;
import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVotes;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaVoteRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgendaVoteService {

  private final AgendaVoteRepository agendaVoteRepository;
  private final AgendaRepository agendaRepository;
  private final UserRepository userRepository;
  private final AgendaVoteStatsRedisService agendaVoteStatsRedisService;

  /** 투표 생성 또는 변경 (기존 투표가 있으면 제거 후 새로 저장) */
  @Transactional
  public AgendaVoteStatResponseDto createAgendaVote(
    Long userId,
    AgendaVoteCreateRequestDto dto
  ) {
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));
    Agenda agenda = agendaRepository
      .findByIdWithWriteLock(dto.agendaId())
      .orElseThrow(() ->
        new NotFoundException("해당 아젠다가 존재하지 않습니다.")
      );

    Optional<AgendaVotes> existing = agendaVoteRepository.findByAgendaIdAndUserId(
      dto.agendaId(),
      userId
    );

    agendaVoteRepository.deleteByAgendaIdAndUserId(dto.agendaId(), userId);

    agendaVoteRepository.save(new AgendaVotes(agenda, user, dto.voteType()));

    agendaVoteRepository.flush();
    agendaVoteStatsRedisService.afterVoteSaved(
      dto.agendaId(),
      existing.map(AgendaVotes::getVoteType),
      dto.voteType()
    );

    return agendaVoteStatsRedisService.getStats(dto.agendaId());
  }

  @Transactional(readOnly = true)
  public AgendaVoteResponseDto getAgendaVote(Long userId, Long agendaId) {
    AgendaVotes vote = agendaVoteRepository
      .findByAgendaIdAndUserId(agendaId, userId)
      .orElse(null);
    if (vote == null) {
      return null;
    }
    return new AgendaVoteResponseDto(vote.getVoteType());
  }

  @Transactional
  public void deleteAgendaVote(Long userId, Long agendaId) {
    Optional<AgendaVotes> existing = agendaVoteRepository.findByAgendaIdAndUserId(
      agendaId,
      userId
    );
    if (existing.isEmpty()) {
      return;
    }
    AgendaVoteType removedType = existing.get().getVoteType();
    agendaVoteRepository.deleteByAgendaIdAndUserId(agendaId, userId);
    agendaVoteRepository.flush();
    agendaVoteStatsRedisService.afterVoteRemoved(agendaId, removedType);
  }
}
