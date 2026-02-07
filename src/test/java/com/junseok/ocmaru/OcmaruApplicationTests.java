package com.junseok.ocmaru;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.user.AuthProvider;
import com.junseok.ocmaru.domain.user.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@Rollback(false)
class OcmaruApplicationTests {

  @PersistenceContext
  EntityManager em;

  @Test
  void contextLoads() {
    User user = new User("df", "efwef", AuthProvider.LOCAL, "fwefwef");
    em.persist(user);

    User findUser = em.find(User.class, user.getId());

    assertEquals(findUser.getDisplayName(), user.getDisplayName());

    Opinion opinion = new Opinion(findUser, "와우");
    em.persist(opinion);

    assertEquals(findUser, opinion.getUser());

    List<Opinion> opinions = em
      .createQuery("select o from Opinion o", Opinion.class)
      .getResultList();

    Cluster cluster = new Cluster(opinions, "dfd", "dfdf", 23);

    em.persist(cluster);

    Agenda agenda = new Agenda("title", "desc", findUser);

    em.persist(agenda);

    em.flush();
  }
}
