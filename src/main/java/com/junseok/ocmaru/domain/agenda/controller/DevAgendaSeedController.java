package com.junseok.ocmaru.domain.agenda.controller;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaTimelineItem;
import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaTimelineItemRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dev/agendas")
@RequiredArgsConstructor
public class DevAgendaSeedController {

  private final AgendaRepository agendaRepository;
  private final AgendaTimelineItemRepository agendaTimelineItemRepository;
  private final UserRepository userRepository;

  @PostMapping("/seed")
  @Transactional
  public ResponseEntity<String> seedAgendas() {
    // 1) 테스트용 유저 확보
    User user = userRepository
      .findAll()
      .stream()
      .findFirst()
      .orElseGet(() -> userRepository.save(new User("dev@example.com", "password", "개발자")));

    // 2) 기존 Dev 데이터 제거 (중복 방지)
    List<Agenda> existing = agendaRepository.findAllByWriterId(user.getId());
    if (!existing.isEmpty()) {
      for (Agenda agenda : existing) {
        agendaTimelineItemRepository.deleteAll(
          agendaTimelineItemRepository.findByAgendaIdOrderByCreatedAtAsc(
              agenda.getId()
            )
        );
      }
      agendaRepository.deleteAll(existing);
    }

    // 3) 샘플 안건들 생성
    Agenda a1 = new Agenda(
      "읍내 주차장 확충 및 야간 무료 개방",
      "읍내 중심가 주차 공간을 확충하고, 야간에는 주민들에게 무료로 개방합니다.",
      user
    );
    a1.setAgendaStatus(AgendaStatus.EXECUTING);
    a1.updateReferences(
      List.of("https://ocmaru.example/parking-plan"),
      List.of("/files/parking-plan.pdf")
    );
    a1.setThumbnail("/images/agendas/parking.jpg");
    a1.increaseVoteCount(132);
    a1.increaseViewCount(1023);

    Agenda a2 = new Agenda(
      "어린이 놀이터 안전시설 개선",
      "노후된 놀이터 시설을 교체하고 CCTV 및 안전 울타리를 설치합니다.",
      user
    );
    a2.setAgendaStatus(AgendaStatus.EXECUTING);
    a2.updateReferences(
      List.of("https://ocmaru.example/playground-safety"),
      List.of("/files/playground-safety.hwp")
    );
    a2.setThumbnail("/images/agendas/playground.jpg");
    a2.increaseVoteCount(87);
    a2.increaseViewCount(754);

    Agenda a3 = new Agenda(
      "야간 보안등 추가 설치",
      "어두운 골목과 보행로에 LED 보안등을 추가로 설치합니다.",
      user
    );
    a3.setAgendaStatus(AgendaStatus.EXECUTING);
    a3.updateReferences(
      List.of("https://ocmaru.example/street-light"),
      List.of()
    );
    a3.setThumbnail("/images/agendas/light.jpg");
    a3.increaseVoteCount(45);
    a3.increaseViewCount(389);

    agendaRepository.saveAll(List.of(a1, a2, a3));

    // 4) 각 안건에 대한 실행 타임라인 샘플 데이터 추가
    AgendaTimelineItem t1 = new AgendaTimelineItem(
      a1,
      user,
      "주차장 부지 확보를 위한 실태 조사를 완료했습니다.",
      null
    );
    t1.setAuthorName("옥천군청 도시과");

    AgendaTimelineItem t2 = new AgendaTimelineItem(
      a1,
      user,
      "설계 용역을 발주했고, 7월 중 설계가 완료될 예정입니다.",
      null
    );
    t2.setAuthorName("옥천군청 도시과");

    AgendaTimelineItem t3 = new AgendaTimelineItem(
      a2,
      user,
      "놀이터 노후 시설 점검을 완료하고 교체 목록을 확정했습니다.",
      null
    );
    t3.setAuthorName("옥천군청 복지과");

    AgendaTimelineItem t4 = new AgendaTimelineItem(
      a3,
      user,
      "야간이 어두운 구간 23곳을 선정했습니다.",
      null
    );
    t4.setAuthorName("옥천군청 안전총괄과");

    agendaTimelineItemRepository.saveAll(List.of(t1, t2, t3, t4));

    return ResponseEntity.ok("Dev agendas seeded.");
  }
}

