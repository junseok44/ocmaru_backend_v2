package com.junseok.ocmaru.domain.agenda.controller;

import com.junseok.ocmaru.domain.agenda.dto.AgendaCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaFileUploadResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaBookmarkStatusResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaUpdateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteStatResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.ExecutionTimelineUpdateRequestDto;
import com.junseok.ocmaru.domain.agenda.service.AgendaService;
import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.opinion.dto.OpinionCreateRequestDto;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/agendas")
@RequiredArgsConstructor
public class AgendaController {

  private final AgendaService agendaService;

  @GetMapping("")
  public ResponseEntity<List<AgendaResponseDto>> getAllAgendas(
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    List<AgendaResponseDto> response = agendaService.getAllAgendas(
      offset,
      limit
    );
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/my-opinions")
  public ResponseEntity<List<AgendaResponseDto>> getMyOpinions(
    @CurrentUser AuthPrincipal user,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    List<AgendaResponseDto> response = agendaService.getMyOpinions(
      user.getId(),
      offset,
      limit
    );
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/bookmarked")
  public ResponseEntity<List<AgendaResponseDto>> getBookmarkedAgendas(
    @CurrentUser AuthPrincipal user,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    List<AgendaResponseDto> response = agendaService.getBookmarkedAgendas(
      user.getId(),
      offset,
      limit
    );
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<AgendaResponseDto> getAgenda(@PathVariable Long id) {
    AgendaResponseDto response = agendaService.getAgendaById(id);
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/{id}/bookmark-status")
  public ResponseEntity<AgendaBookmarkStatusResponseDto> getBookmarkStatus(
    @PathVariable Long id,
    Authentication authentication
  ) {
    Long userId = null;
    if (
      authentication != null &&
      authentication.isAuthenticated() &&
      authentication.getPrincipal() instanceof AuthPrincipal user
    ) {
      userId = user.getId();
    }

    return ResponseEntity.status(200).body(
      agendaService.getBookmarkStatus(id, userId)
    );
  }

  @GetMapping("/{id}/opinions")
  public ResponseEntity<List<OpinionResponseDto>> getOpinionsByAgendaId(
    @PathVariable Long id
  ) {
    List<OpinionResponseDto> response = agendaService.getOpinionsByAgendaId(id);
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/{id}/opinions")
  public ResponseEntity<OpinionResponseDto> createOpinion(
    @CurrentUser AuthPrincipal user,
    @PathVariable Long id,
    @RequestBody @Valid OpinionCreateRequestDto dto
  ) {
    OpinionResponseDto response = agendaService.createOpinionForAgenda(
      user.getId(),
      id,
      dto
    );
    return ResponseEntity.status(201).body(response);
  }

  @PostMapping("")
  public ResponseEntity<AgendaResponseDto> createAgenda(
    @CurrentUser AuthPrincipal user,
    @RequestBody @Valid AgendaCreateRequestDto dto
  ) {
    AgendaResponseDto response = agendaService.createAgenda(user.getId(), dto);
    return ResponseEntity.status(201).body(response);
  }

  @PatchMapping("/{id}")
  public ResponseEntity<AgendaResponseDto> updateAgenda(
    @PathVariable Long id,
    @RequestBody @Valid AgendaUpdateRequestDto dto
  ) {
    AgendaResponseDto response = agendaService.updateAgenda(id, dto);
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/{id}/files")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<AgendaFileUploadResponseDto> uploadAgendaFile(
    @PathVariable Long id,
    @RequestParam("file") MultipartFile file
  ) {
    AgendaFileUploadResponseDto response = agendaService.uploadAgendaFile(
      id,
      file
    );
    return ResponseEntity.status(200).body(response);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteAgenda(@PathVariable Long id) {
    agendaService.deleteAgenda(id);
    return ResponseEntity.status(204).build();
  }

  @PostMapping("/{id}/bookmark")
  public ResponseEntity<Void> bookmarkAgenda(
    @CurrentUser AuthPrincipal user,
    @PathVariable Long id
  ) {
    agendaService.bookmarkAgenda(id, user.getId());
    return ResponseEntity.status(200).build();
  }

  @DeleteMapping("/{id}/bookmark")
  public ResponseEntity<Void> unbookmarkAgenda(
    @CurrentUser AuthPrincipal user,
    @PathVariable Long id
  ) {
    agendaService.unbookmarkAgenda(id, user.getId());
    return ResponseEntity.status(204).build();
  }

  @GetMapping("/{id}/votes")
  public ResponseEntity<AgendaVoteStatResponseDto> getAgendaVotes(
    @PathVariable Long id
  ) {
    AgendaVoteStatResponseDto response = agendaService.getAgendaVotes(id);
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/{id}/execution-timeline")
  public ResponseEntity<List<ExecutionTimelineResponseDto>> getExecutionTimeline(
    @PathVariable Long id
  ) {
    List<ExecutionTimelineResponseDto> response = agendaService.getExecutionTimeline(
      id
    );
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/{id}/execution-timeline")
  public ResponseEntity<Void> createExecutionTimeline(
    @CurrentUser AuthPrincipal user,
    @PathVariable Long id,
    @RequestBody @Valid ExecutionTimelineCreateRequestDto dto
  ) {
    agendaService.createExecutionTimeline(id, user.getId(), dto);
    return ResponseEntity.status(201).build();
  }

  @PatchMapping("/{id}/execution-timeline/{itemId}")
  public ResponseEntity<Void> updateExecutionTimeline(
    @PathVariable Long id,
    @PathVariable Long itemId,
    @RequestBody @Valid ExecutionTimelineUpdateRequestDto dto
  ) {
    agendaService.updateExecutionTimeline(id, itemId, dto);
    return ResponseEntity.status(200).build();
  }
}
