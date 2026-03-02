package com.junseok.ocmaru.domain.opinion.controller;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import com.junseok.ocmaru.global.exception.NotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dev")
public class DevOpinionController {

  private final OpinionRepository opinionRepository;
  private final UserRepository userRepository;

  @PostMapping("/seed-opinions")
  public ResponseEntity<Map<String, Object>> seedOpinions(
    @CurrentUser AuthPrincipal principal
  ) {
    User user = userRepository
      .findById(principal.getId())
      .orElseThrow(() -> new NotFoundException("유저를 찾을 수 없습니다."));

    List<String> contents = List.of(
      "아파트 주차장이 너무 부족합니다.",
      "놀이터 시설이 낡아서 위험합니다.",
      "골목길 가로등을 더 설치해주세요.",
      "분리수거함이 부족합니다.",
      "버스 배차 간격을 줄여주세요.",
      "도서관 운영시간을 연장해주세요."
    );

    List<Opinion> opinions = new ArrayList<>();
    for (String content : contents) {
      opinions.add(new Opinion(user, content));
    }

    opinionRepository.saveAll(opinions);

    return ResponseEntity.ok(
      Map.of(
        "success",
        true,
        "count",
        opinions.size(),
        "message",
        opinions.size() + "개의 의견이 생성되었습니다."
      )
    );
  }
}
