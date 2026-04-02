package com.junseok.ocmaru.dev;

import com.junseok.ocmaru.dev.dto.LoadTestUsersSeedResponseDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dev/loadtest-users")
@Tag(
  name = "개발 전용",
  description = "부하테스트용 유저 시드 (운영 노출 시 주의)"
)
@RequiredArgsConstructor
public class DevLoadTestUserController {

  private final DevLoadTestUserSeedService devLoadTestUserSeedService;

  /**
   * 부하테스트용 로컬 유저 N명 생성 (이미 있으면 스킵).
   * k6: {@code POST /api/dev/loadtest-users/seed?count=60}
   */
  @PostMapping("/seed")
  public ResponseEntity<LoadTestUsersSeedResponseDto> seed(
    @RequestParam(defaultValue = "50") int count
  ) {
    LoadTestUsersSeedResponseDto body = devLoadTestUserSeedService.seedUsers(
      count
    );
    return ResponseEntity.ok(body);
  }
}
