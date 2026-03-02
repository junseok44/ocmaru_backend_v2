package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.domain.agenda.repository.AgendaBookmarkRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaTimelineItemRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaVoteRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionClusterRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.report.repository.ReportRepository;
import com.junseok.ocmaru.domain.user.dto.UserListItemDto;
import com.junseok.ocmaru.domain.user.dto.UserStatsResponseDto;
import com.junseok.ocmaru.domain.user.dto.UserUpdateRequestDto;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final OpinionRepository opinionRepository;
  private final OpinionLikeRepository opinionLikeRepository;
  private final AgendaRepository agendaRepository;
  private final AgendaBookmarkRepository agendaBookmarkRepository;
  private final OpinionCommentRepository opinionCommentRepository;
  private final OpinionCommentLikeRepository opinionCommentLikeRepository;
  private final OpinionClusterRepository opinionClusterRepository;
  private final AgendaVoteRepository agendaVoteRepository;
  private final AgendaTimelineItemRepository agendaTimelineItemRepository;
  private final ReportRepository reportRepository;

  public User findById(Long id) {
    return userRepository
      .findById(id)
      .orElseThrow(() -> new NotFoundException("유저를 찾을 수 없습니다."));
  }

  @Transactional(readOnly = true)
  public UserStatsResponseDto getMyStats(Long userId) {
    return new UserStatsResponseDto(
      opinionRepository.countByUserId(userId),
      opinionLikeRepository.countByUserId(userId),
      agendaRepository.countDistinctAgendasWhereUserHasOpinion(userId),
      agendaBookmarkRepository.countByUserId(userId)
    );
  }

  @Transactional
  public User updateUser(Long userId, UserUpdateRequestDto dto) {
    User user = findById(userId);
    if (dto.displayName() != null) {
      user.setDisplayName(dto.displayName());
    }
    if (dto.avatarUrl() != null) {
      user.setAvatarUrl(dto.avatarUrl());
    }
    return user;
  }

  @Transactional
  public void deleteUser(Long userId) {
    List<Long> commentIds = opinionCommentRepository.findIdsByUserId(userId);
    if (!commentIds.isEmpty()) {
      opinionCommentLikeRepository.deleteByOpinionCommentIdIn(commentIds);
    }
    opinionCommentRepository.deleteByUserId(userId);

    List<Long> opinionIds = opinionRepository.findIdsByUserId(userId);
    if (!opinionIds.isEmpty()) {
      opinionClusterRepository.deleteByOpinionIdIn(opinionIds);
      opinionLikeRepository.deleteByOpinionIdIn(opinionIds);
    }
    opinionLikeRepository.deleteByUserId(userId);
    opinionRepository.deleteByUserId(userId);

    agendaVoteRepository.deleteByUserId(userId);
    agendaBookmarkRepository.deleteByUserId(userId);
    agendaTimelineItemRepository.deleteByUserId(userId);
    reportRepository.deleteByReporterId(userId);

    userRepository.deleteById(userId);
  }

  @Transactional(readOnly = true)
  public List<UserListItemDto> getUsers(Integer limit, Integer offset, String search) {
    int pageSize = limit != null && limit > 0 ? limit : 20;
    int pageIndex = offset != null ? offset / pageSize : 0;
    Pageable pageable = PageRequest.of(pageIndex, pageSize);

    String keyword = (search != null && !search.isBlank()) ? search : null;
    return userRepository
      .searchUsers(keyword, pageable)
      .stream()
      .map(UserListItemDto::from)
      .toList();
  }
}
