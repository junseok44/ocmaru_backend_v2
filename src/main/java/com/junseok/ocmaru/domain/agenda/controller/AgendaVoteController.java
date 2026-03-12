package com.junseok.ocmaru.domain.agenda.controller;

import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteCreateRequestDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteResponseDto;
import com.junseok.ocmaru.domain.agenda.dto.AgendaVoteStatResponseDto;
import com.junseok.ocmaru.domain.agenda.service.AgendaVoteService;
import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/agendas/votes")
@RequiredArgsConstructor
public class AgendaVoteController {

  private final AgendaVoteService agendaVoteService;

  @PostMapping("")
  public ResponseEntity<AgendaVoteStatResponseDto> createAgendaVote(
    @CurrentUser AuthPrincipal user,
    @RequestBody @Valid AgendaVoteCreateRequestDto dto
  ) {
    AgendaVoteStatResponseDto response = agendaVoteService.createAgendaVote(
      user.getId(),
      dto
    );
    return ResponseEntity.status(201).body(response);
  }

  @GetMapping("/user/{userId}/agenda/{agendaId}")
  public ResponseEntity<AgendaVoteResponseDto> getAgendaVote(
    @PathVariable Long userId,
    @PathVariable Long agendaId
  ) {
    AgendaVoteResponseDto response = agendaVoteService.getAgendaVote(
      userId,
      agendaId
    );
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/user/{userId}/agenda/{agendaId}")
  public ResponseEntity<Void> deleteAgendaVote(
    @PathVariable Long userId,
    @PathVariable Long agendaId
  ) {
    agendaVoteService.deleteAgendaVote(userId, agendaId);
    return ResponseEntity.noContent().build();
  }
}
