package com.junseok.ocmaru.domain.category.controller;

import com.junseok.ocmaru.domain.category.dto.CategoryResponseDto;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categories")
public class CategoryController {

  @GetMapping("")
  public ResponseEntity<List<CategoryResponseDto>> getCategories() {
    List<CategoryResponseDto> categories = List.of(
      new CategoryResponseDto("traffic", "교통", "교통/주차 관련 안건", "🚗"),
      new CategoryResponseDto("safety", "안전", "생활 안전 관련 안건", "🛡️"),
      new CategoryResponseDto("environment", "환경", "환경/위생 관련 안건", "🌿"),
      new CategoryResponseDto("welfare", "복지", "복지/돌봄 관련 안건", "🤝"),
      new CategoryResponseDto("culture", "문화", "문화/교육 관련 안건", "🎭")
    );
    return ResponseEntity.ok(categories);
  }
}
