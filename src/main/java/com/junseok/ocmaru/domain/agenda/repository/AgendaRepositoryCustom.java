package com.junseok.ocmaru.domain.agenda.repository;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import java.util.List;

public interface AgendaRepositoryCustom {
  List<Agenda> findAllByBookmarkedUsersId(Long userId, int offset, int limit);

  List<Agenda> findAllByWriterId(Long writerId, int offset, int limit);
}
