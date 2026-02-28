package com.junseok.ocmaru.domain.agenda.service;

import com.junseok.ocmaru.domain.agenda.dto.AgendaCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaFilesUpdateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaUpdateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteStatResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineUpdateRequestDto;
import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaBookmark;
import com.junseok.ocmaru.domain.agenda.entity.AgendaTimelineItem;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.repository.AgendaBookmarkRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaTimelineItemRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaVoteRepository;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.cluster.repository.ClusterRepository;
import com.junseok.ocmaru.domain.opinion.dto.OpinionCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionClusterRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgendaService {

  private final AgendaRepository agendaRepository;
  private final AgendaBookmarkRepository agendaBookmarkRepository;
  private final AgendaVoteRepository agendaVoteRepository;
  private final AgendaTimelineItemRepository agendaTimelineItemRepository;
  private final ClusterRepository clusterRepository;
  private final OpinionRepository opinionRepository;
  private final OpinionClusterRepository opinionClusterRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<AgendaResponseDto> getMyOpinions(
    Long userId,
    Integer offset,
    Integer limit
  ) {
    int pageSize = limit != null && limit > 0 ? limit : 10;
    int pageIndex = offset != null && pageSize > 0 ? offset / pageSize : 0;
    Pageable pageable = PageRequest.of(pageIndex, pageSize);
    List<Agenda> agendas = agendaRepository.findAgendasWhereUserHasOpinion(
      userId,
      pageable
    );
    return agendas.stream().map(AgendaResponseDto::from).toList();
  }

  @Transactional(readOnly = true)
  public List<AgendaResponseDto> getBookmarkedAgendas(
    Long userId,
    Integer offset,
    Integer limit
  ) {
    int pageSize = limit != null && limit > 0 ? limit : 10;
    int pageIndex = offset != null && pageSize > 0 ? offset / pageSize : 0;
    Pageable pageable = PageRequest.of(pageIndex, pageSize);
    List<Agenda> agendas = agendaBookmarkRepository.findBookmarkedAgendasByUserId(
      userId,
      pageable
    );
    return agendas.stream().map(AgendaResponseDto::from).toList();
  }

  @Transactional(readOnly = true)
  public AgendaResponseDto getAgendaById(Long id) {
    Agenda agenda = agendaRepository
      .findById(id)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));
    return AgendaResponseDto.from(agenda);
  }

  @Transactional(readOnly = true)
  public List<OpinionResponseDto> getOpinionsByAgendaId(Long agendaId) {
    List<Cluster> clusters = clusterRepository.findByAgendaId(agendaId);
    if (clusters.isEmpty()) {
      return List.of();
    }
    List<Opinion> opinions = new ArrayList<>();
    for (Cluster c : clusters) {
      opinions.addAll(
        opinionClusterRepository.findOpinionsWithUserByClusterId(c.getId())
      );
    }
    return opinions.stream().map(OpinionResponseDto::from).toList();
  }

  @Transactional
  public OpinionResponseDto createOpinionForAgenda(
    Long userId,
    Long agendaId,
    OpinionCreateRequestDto dto
  ) {
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));
    Agenda agenda = agendaRepository
      .findById(agendaId)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));

    Opinion opinion = new Opinion(user, dto.content());
    opinionRepository.save(opinion);

    List<Cluster> clusters = clusterRepository.findByAgendaId(agendaId);
    if (clusters.isEmpty()) {
      Cluster defaultCluster = new Cluster(
        agenda,
        "일반 의견",
        "이 안건에 대한 일반 의견들입니다.",
        null,
        0
      );
      defaultCluster = clusterRepository.save(defaultCluster);
      clusters = List.of(defaultCluster);
    }
    for (Cluster cluster : clusters) {
      opinion.addCluster(cluster);
    }

    return OpinionResponseDto.from(opinion);
  }

  @Transactional
  public AgendaResponseDto createAgenda(Long userId, AgendaCreateRequestDto dto) {
    User writer = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));
    Agenda agenda = new Agenda(
      dto.title(),
      dto.summary(),
      writer
    );
    agenda = agendaRepository.save(agenda);
    return AgendaResponseDto.from(agenda);
  }

  @Transactional
  public AgendaResponseDto updateAgenda(Long id, AgendaUpdateRequestDto dto) {
    Agenda agenda = agendaRepository
      .findById(id)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));
    agenda.updateTitleAndDescription(dto.title(), dto.summary());
    return AgendaResponseDto.from(agenda);
  }

  @Transactional
  public AgendaResponseDto updateAgendaFiles(
    Long id,
    AgendaFilesUpdateRequestDto dto
  ) {
    Agenda agenda = agendaRepository
      .findById(id)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));
    agenda.updateReferences(
      dto.referenceLinks(),
      dto.referenceFiles()
    );
    return AgendaResponseDto.from(agenda);
  }

  @Transactional
  public void deleteAgenda(Long id) {
    if (!agendaRepository.existsById(id)) {
      throw new NotFoundException("해당 아젠다가 존재하지 않습니다.");
    }
    agendaRepository.deleteById(id);
  }

  @Transactional
  public void bookmarkAgenda(Long agendaId, Long userId) {
    if (agendaBookmarkRepository.existsByAgendaIdAndUserId(agendaId, userId)) {
      return;
    }
    Agenda agenda = agendaRepository
      .findById(agendaId)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));
    agendaBookmarkRepository.save(new AgendaBookmark(agenda, user));
  }

  @Transactional
  public void unbookmarkAgenda(Long agendaId, Long userId) {
    agendaBookmarkRepository.deleteByAgendaIdAndUserId(agendaId, userId);
  }

  @Transactional(readOnly = true)
  public AgendaVoteStatResponseDto getAgendaVotes(Long agendaId) {
    long agree = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.AGREEMENT
    );
    long disagree = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.DISAGREEMENT
    );
    long neutral = agendaVoteRepository.countByAgendaIdAndVoteType(
      agendaId,
      AgendaVoteType.NEUTRAL
    );
    return new AgendaVoteStatResponseDto(
      (int) (agree + disagree + neutral),
      (int) agree,
      (int) disagree,
      (int) neutral
    );
  }

  @Transactional(readOnly = true)
  public List<ExecutionTimelineResponseDto> getExecutionTimeline(Long agendaId) {
    List<AgendaTimelineItem> items = agendaTimelineItemRepository.findByAgendaIdOrderByCreatedAtAsc(
      agendaId
    );
    return items.stream().map(ExecutionTimelineResponseDto::from).toList();
  }

  @Transactional
  public void createExecutionTimeline(
    Long agendaId,
    Long userId,
    ExecutionTimelineCreateRequestDto dto
  ) {
    Agenda agenda = agendaRepository
      .findById(agendaId)
      .orElseThrow(() -> new NotFoundException("해당 아젠다가 존재하지 않습니다."));
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> new NotFoundException("유저가 없습니다."));
    AgendaTimelineItem item = new AgendaTimelineItem(
      agenda,
      user,
      dto.content(),
      dto.imageUrl()
    );
    if (dto.authorName() != null && !dto.authorName().isBlank()) {
      item.setAuthorName(dto.authorName());
    }
    agendaTimelineItemRepository.save(item);
  }

  @Transactional
  public void updateExecutionTimeline(
    Long agendaId,
    Long itemId,
    ExecutionTimelineUpdateRequestDto dto
  ) {
    AgendaTimelineItem item = agendaTimelineItemRepository
      .findById(itemId)
      .orElseThrow(() ->
        new NotFoundException("해당 타임라인 항목이 존재하지 않습니다.")
      );
    if (!item.getAgenda().getId().equals(agendaId)) {
      throw new NotFoundException("해당 아젠다의 타임라인 항목이 아닙니다.");
    }
    item.update(
      dto.authorName(),
      dto.content(),
      dto.imageUrl()
    );
  }
}
