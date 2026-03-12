package com.junseok.ocmaru.domain.notification.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

  @GetMapping("")
  public ResponseEntity<List<Map<String, Object>>> getNotifications() {
    // 알림 도메인이 아직 없으므로 빈 배열로 응답해 프런트 오류/404를 방지한다.
    return ResponseEntity.ok(List.of());
  }
}
