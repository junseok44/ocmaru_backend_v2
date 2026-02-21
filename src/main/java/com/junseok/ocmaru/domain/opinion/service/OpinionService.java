package com.junseok.ocmaru.domain.opinion.service;

import com.junseok.ocmaru.domain.cluster.dto.ClusterWithAgendaDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionSearchCondition;
import com.junseok.ocmaru.domain.opinion.dto.OpinionUpdateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionWithClustersAndAgendaDto;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.projections.OpinionCommentCountProjection;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OpinionService {

  private final OpinionRepository opinionRepository;
  private final OpinionCommentRepository opinionCommentRepository;
  private final OpinionLikeRepository opinionLikeRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<OpinionResponseDto> searchOpinions(
    OpinionSearchCondition cond,
    int limit,
    int offset,
    Long userIdForLikedByMe,
    boolean includeLikedByMe,
    boolean includeCommentCounts
  ) {
    List<Opinion> opinions = opinionRepository.searchOpinions(
      cond,
      offset,
      limit
    );

    Map<Long, Integer> commentCountMap = new HashMap<>();
    Map<Long, Boolean> opinionLikedMap = new HashMap<>();

    List<Long> opinionIds = opinions.stream().map(op -> op.getId()).toList();

    if (includeCommentCounts) {
      List<OpinionCommentCountProjection> commentCountList = opinionCommentRepository.getOpinionCommentCount(
        opinionIds
      );

      for (OpinionCommentCountProjection op : commentCountList) {
        commentCountMap.put(op.getOpinionId(), op.getCnt());
      }
    }

    if (
      includeLikedByMe && userIdForLikedByMe != null && !opinionIds.isEmpty()
    ) {
      Set<Long> likedIds = opinionLikeRepository.getUserLikedOpinionIdsIn(
        userIdForLikedByMe,
        opinionIds
      );

      for (Long id : likedIds) {
        opinionLikedMap.put(id, true);
      }
    }

    // dto로 변환함으로써, 엔티티 타입의 정보를 숨기고, 엔티티 의존성을 끊는다. 무한루프 가능성을 막고. 필요한 데이터만 전송한다.
    return opinions
      .stream()
      .map(op -> {
        return OpinionResponseDto.toDto(
          op,
          commentCountMap.getOrDefault(op.getId(), 0),
          opinionLikedMap.getOrDefault(op.getId(), false)
        );
      })
      .toList();
  }

  @Transactional(readOnly = true)
  public OpinionWithClustersAndAgendaDto getOpinion(Long id) {
    Optional<Opinion> rs = opinionRepository.findById(id);

    if (rs.isEmpty()) {
      throw new NotFoundException("찾으려는 opinion은 존재하지 않습니다.");
    }

    Opinion opinion = rs.get();

    List<ClusterWithAgendaDto> clusterDtos = opinion
      .getClusters()
      .stream()
      .map(c -> ClusterWithAgendaDto.from(c, c.getAgenda()))
      .toList();

    return OpinionWithClustersAndAgendaDto.from(
      OpinionResponseDto.toDto(opinion, 0, false),
      clusterDtos
    );
  }

  public OpinionResponseDto createOpinion(
    Long userId,
    OpinionCreateRequestDto dto
  ) {
    User user = userRepository
      .findById(userId)
      .orElseThrow(() -> {
        return new NotFoundException("유저가 없습니다.");
      });

    Opinion newOpinion = new Opinion(user, dto.content());

    opinionRepository.save(newOpinion);

    return OpinionResponseDto.toDto(null, 0, false);
  }

  public OpinionResponseDto updateOpinion(
    Long opinionId,
    OpinionUpdateRequestDto dto
  ) {
    Opinion opinion = opinionRepository
      .findById(opinionId)
      .orElseThrow(() -> new NotFoundException("수정하려는 opinion이 없습니다.")
      );

    opinion.applyUpdate(dto);

    return OpinionResponseDto.toDto(opinion, 0, false);
  }

  public void deleteOpinion(Long opinionId) {
    opinionRepository.deleteById(opinionId);
  }
}
