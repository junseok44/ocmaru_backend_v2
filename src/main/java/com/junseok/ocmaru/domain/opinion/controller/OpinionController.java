package com.junseok.ocmaru.domain.opinion.controller;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.opinion.dto.OpinionCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionSearchCondition;
import com.junseok.ocmaru.domain.opinion.dto.OpinionSearchResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionTranscribeResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionUpdateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionWithClustersAndAgendaDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentUpdateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.comment.OpinionCommentsResponseDto;
import com.junseok.ocmaru.domain.opinion.dto.like.OpinionLikedResponseDto;
import com.junseok.ocmaru.domain.opinion.service.OpinionCommentService;
import com.junseok.ocmaru.domain.opinion.service.OpinionLikeService;
import com.junseok.ocmaru.domain.opinion.service.OpinionService;
import com.junseok.ocmaru.domain.opinion.service.OpinionTranscribeService;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/opinions")
@Tag(
  name = "의견",
  description = "의견 검색·CRUD, 댓글, 좋아요, 음성 전사(Whisper)"
)
public class OpinionController {

  private final OpinionService opinionService;
  private final OpinionCommentService opinionCommentService;
  private final OpinionLikeService opinionLikeService;
  private final OpinionTranscribeService opinionTranscribeService;

  // opinion은 클러스터와 다대다 관계.

  // 만약 unclustered가 필요하다? 그러면 opinionCluster와 join 한다음에, 아무것도 없는 것.

  // 만약 내가 쓴게 필요하다? 그러면 user와 join해서, where user.id = :userId
  // 만약에 내가 좋아요 한게 필요하다. 그러면 opinionLike에서 opinionLike.user.id = :userId;
  // opinionLike에 user와 opinion을 모두 join한다음에, 해당하는 opinion만 select 하는 식으로.
  // 왜냐하면

  // 전체 오피니언 불러오기.
  @GetMapping("")
  public ResponseEntity<OpinionSearchResponseDto> searchAllOpinions(
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    System.out.println("offset: " + offset);
    OpinionSearchCondition cond = new OpinionSearchCondition(
      null,
      null,
      false,
      true,
      true
    );

    List<OpinionResponseDto> opinions = opinionService.searchOpinions(
      cond,
      limit,
      offset,
      null,
      false,
      true
    );

    return ResponseEntity
      .status(200)
      .body(new OpinionSearchResponseDto(opinions));
  }

  // 클러스터링 되지 않은 의견들 불러오기.
  @GetMapping("/unclustered")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionSearchResponseDto> searchUnclusteredOpinions(
    @CurrentUser AuthPrincipal user,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    OpinionSearchCondition cond = new OpinionSearchCondition(
      null,
      null,
      true,
      true,
      true
    );

    List<OpinionResponseDto> opinions = opinionService.searchOpinions(
      cond,
      limit,
      offset,
      null,
      false,
      true
    );

    return ResponseEntity
      .status(200)
      .body(new OpinionSearchResponseDto(opinions));
  }

  // 내가 쓴 opinion들 불러오기.
  @GetMapping("/my")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionSearchResponseDto> searchMyOpinions(
    @CurrentUser AuthPrincipal user,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    OpinionSearchCondition cond = new OpinionSearchCondition(
      user.getId(),
      null,
      false,
      true,
      true
    );

    List<OpinionResponseDto> opinions = opinionService.searchOpinions(
      cond,
      limit,
      offset,
      null,
      false,
      true
    );

    return ResponseEntity
      .status(200)
      .body(new OpinionSearchResponseDto(opinions));
  }

  // 내가 좋아요 한 거 불러오기.
  @GetMapping("/liked")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionSearchResponseDto> searchLikedOpinions(
    @CurrentUser AuthPrincipal user,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    OpinionSearchCondition cond = new OpinionSearchCondition(
      null,
      user.getId(),
      false,
      true,
      true
    );

    List<OpinionResponseDto> opinions = opinionService.searchOpinions(
      cond,
      limit,
      offset,
      null,
      false,
      true
    );

    return ResponseEntity
      .status(200)
      .body(new OpinionSearchResponseDto(opinions));
  }

  @GetMapping("/{id}")
  public ResponseEntity<OpinionWithClustersAndAgendaDto> getOpinion(
    @PathVariable("id") Long opinionId
  ) {
    OpinionWithClustersAndAgendaDto opinionResponse = opinionService.getOpinion(
      opinionId
    );

    return ResponseEntity.status(200).body(opinionResponse);
  }

  @PostMapping("/transcribe")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionTranscribeResponseDto> transcribe(
    @CurrentUser AuthPrincipal user,
    @RequestParam("audio") MultipartFile audio
  ) {
    String text = opinionTranscribeService.transcribe(audio);
    return ResponseEntity.ok(new OpinionTranscribeResponseDto(text));
  }

  @PostMapping("")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionResponseDto> createOpinion(
    @CurrentUser AuthPrincipal user,
    @RequestBody OpinionCreateRequestDto dto
  ) {
    OpinionResponseDto response = opinionService.createOpinion(
      user.getId(),
      dto
    );
    return ResponseEntity.status(200).body(response);
  }

  @PatchMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionResponseDto> updateOpinion(
    @PathVariable("id") Long opinionId,
    @RequestBody OpinionUpdateRequestDto dto
  ) {
    OpinionResponseDto response = opinionService.updateOpinion(opinionId, dto);

    return ResponseEntity.status(200).body(response);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> deleteOpinion(
    @PathVariable("id") Long opinionId
  ) {
    opinionService.deleteOpinion(opinionId);

    return ResponseEntity.status(200).body(null);
  }

  @PostMapping("/{id}/like")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> likeOpinion(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long opinionId
  ) {
    opinionLikeService.likeOpinion(user.getId(), opinionId);

    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}/like")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> unlikeOpinion(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long opinionId
  ) {
    opinionLikeService.unlikeOpinion(user.getId(), opinionId);

    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/like")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<OpinionLikedResponseDto> getOpinionLiked(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long opinionId
  ) {
    boolean isLiked = opinionLikeService.getIsLikedForOpinion(
      user.getId(),
      opinionId
    );
    return ResponseEntity
      .status(200)
      .body(new OpinionLikedResponseDto(isLiked));
  }

  @GetMapping("/{id}/comments")
  public ResponseEntity<OpinionCommentsResponseDto> getOpinionComments(
    @PathVariable("id") Long opinionId
  ) {
    List<OpinionCommentResponseDto> comments = opinionCommentService.getOpinionComments(
      opinionId
    );

    return ResponseEntity
      .status(200)
      .body(new OpinionCommentsResponseDto(comments));
  }

  @PostMapping("/{id}/comments")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> createOpinionComment(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long opinionId,
    @RequestBody OpinionCommentCreateRequestDto dto
  ) {
    opinionCommentService.createOpinionComments(dto, opinionId, user.getId());

    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/comments/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> updateOpinionComment(
    @PathVariable("id") Long commentId,
    @CurrentUser AuthPrincipal user,
    @RequestBody OpinionCommentUpdateRequestDto dto
  ) {
    opinionCommentService.updateOpinionComment(commentId, dto, user.getId());

    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/comments/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> deleteOpinionComment(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long commentId
  ) {
    opinionCommentService.deleteOpinionComment(commentId, user.getId());

    return ResponseEntity.noContent().build();
  }

  @PostMapping("/comments/{id}/like")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> likeOpinionComment(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long commentId
  ) {
    opinionCommentService.likeOpinionComment(commentId, user.getId());

    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/comments/{id}/like")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> unlikeOpinionComment(
    @CurrentUser AuthPrincipal user,
    @PathVariable("id") Long commentId
  ) {
    opinionCommentService.unlikeOpinionComment(commentId, user.getId());
    return ResponseEntity.noContent().build();
  }
}
