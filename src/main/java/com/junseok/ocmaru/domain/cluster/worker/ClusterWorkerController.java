package com.junseok.ocmaru.domain.cluster.worker;

import com.junseok.ocmaru.domain.cluster.dto.ClusterGenerateResponseDto;
import com.junseok.ocmaru.domain.cluster.dto.ClusterWorkerGenerateRequestDto;
import com.junseok.ocmaru.domain.cluster.service.ClusterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/worker")
@RequiredArgsConstructor
public class ClusterWorkerController {

  private final ClusterService clusterService;

  @PostMapping("/cluster/generate")
  public ResponseEntity<ClusterGenerateResponseDto> generateCluster(
    @RequestBody @Valid ClusterWorkerGenerateRequestDto body
  ) {
    ClusterGenerateResponseDto response = clusterService.generateCluster(
      body.jobId()
    );
    return ResponseEntity.ok(response);
  }
}
