package com.junseok.ocmaru.domain.cluster.controller;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.cluster.dto.ClusterAddOpinionRequestDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterCreateRequestDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterRemoveOpinionRequestDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterUpdateRequestDto;
import com.junseok.ocmaru.domain.cluster.service.ClusterService;
import com.junseok.ocmaru.domain.opinion.dto.OpinionResponseDto;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import jakarta.validation.Valid;
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

@RestController
@RequestMapping("/clusters")
@RequiredArgsConstructor
public class ClusterController {

  private final ClusterService clusterService;

  @GetMapping("/")
  public ResponseEntity<List<ClusterResponseDto>> getAllClusters(
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    List<ClusterResponseDto> response = clusterService.getAllClusters(
      offset,
      limit
    );
    return ResponseEntity.status(200).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ClusterResponseDto> getCluster(@PathVariable Long id) {
    ClusterResponseDto response = clusterService.getCluster(id);
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/")
  public ResponseEntity<ClusterResponseDto> createCluster(
    @RequestBody @Valid ClusterCreateRequestDto dto
  ) {
    ClusterResponseDto response = clusterService.createCluster(dto);
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/{id}/opinions")
  public ResponseEntity<ClusterResponseDto> addOpinionToCluster(
    @PathVariable Long id,
    @RequestBody @Valid ClusterAddOpinionRequestDto dto
  ) {
    ClusterResponseDto response = clusterService.addOpinionsToCluster(
      id,
      dto.opinionIds()
    );

    return ResponseEntity.status(200).body(response);
  }

  @DeleteMapping("/{id}/opinions")
  public ResponseEntity<Void> removeOpinionsFromCluster(
    @PathVariable Long id,
    @RequestBody @Valid ClusterRemoveOpinionRequestDto dto
  ) {
    clusterService.removeOpinionsFromCluster(id, dto.opinionIds());
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCluster(@PathVariable Long id) {
    clusterService.deleteCluster(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}")
  public ResponseEntity<Void> updateCluster(
    @PathVariable Long id,
    @RequestBody @Valid ClusterUpdateRequestDto dto
  ) {
    clusterService.updateCluster(id, dto);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/opinions")
  public ResponseEntity<List<OpinionResponseDto>> getOpinionsInCluster(
    @PathVariable Long id,
    @RequestParam(required = false, defaultValue = "0") Integer offset,
    @RequestParam(required = false, defaultValue = "10") Integer limit
  ) {
    List<OpinionResponseDto> response = clusterService.getOpinionsInCluster(id);
    return ResponseEntity.status(200).body(response);
  }

  @PostMapping("/generate")
  @PreAuthorize(
    "hasRole(T(com.junseok.ocmaru.global.constant.RoleConstants).ADMIN)"
  )
  public ResponseEntity<ClusterGenerateResponseDto> generateCluster(
    @CurrentUser AuthPrincipal user
  ) {
    ClusterGenerateResponseDto response = clusterService.generateCluster();
    return ResponseEntity.status(200).body(response);
  }
}
