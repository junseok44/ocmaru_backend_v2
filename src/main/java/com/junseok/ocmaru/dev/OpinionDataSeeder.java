package com.junseok.ocmaru.dev;

import com.junseok.ocmaru.domain.agenda.entity.Agenda;
import com.junseok.ocmaru.domain.agenda.entity.AgendaBookmark;
import com.junseok.ocmaru.domain.agenda.entity.AgendaTimelineItem;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVoteType;
import com.junseok.ocmaru.domain.agenda.entity.AgendaVotes;
import com.junseok.ocmaru.domain.agenda.enums.AgendaStatus;
import com.junseok.ocmaru.domain.agenda.repository.AgendaBookmarkRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaTimelineItemRepository;
import com.junseok.ocmaru.domain.agenda.repository.AgendaVoteRepository;
import com.junseok.ocmaru.domain.cluster.entity.Cluster;
import com.junseok.ocmaru.domain.cluster.repository.ClusterRepository;
import com.junseok.ocmaru.domain.opinion.entity.Opinion;
import com.junseok.ocmaru.domain.opinion.entity.OpinionComment;
import com.junseok.ocmaru.domain.opinion.entity.OpinionCommentLike;
import com.junseok.ocmaru.domain.opinion.entity.OpinionLike;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionCommentRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionLikeRepository;
import com.junseok.ocmaru.domain.opinion.repository.OpinionRepository;
import com.junseok.ocmaru.domain.user.User;
import com.junseok.ocmaru.domain.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpinionDataSeeder implements CommandLineRunner {

  private final OpinionDataSeederProperties seedProperties;
  private final UserRepository userRepository;
  private final OpinionRepository opinionRepository;
  private final AgendaRepository agendaRepository;
  private final AgendaTimelineItemRepository agendaTimelineItemRepository;
  private final AgendaVoteRepository agendaVoteRepository;
  private final AgendaBookmarkRepository agendaBookmarkRepository;
  private final ClusterRepository clusterRepository;
  private final OpinionLikeRepository opinionLikeRepository;
  private final OpinionCommentRepository opinionCommentRepository;
  private final OpinionCommentLikeRepository opinionCommentLikeRepository;

  @Override
  @Transactional
  public void run(String... args) {
    if (!seedProperties.isEnabled()) {
      return;
    }

    int userCount = seedProperties.getUserCount();
    int opinionsPerUser = seedProperties.getOpinionsPerUser();

    log.info(
      "Starting opinion data seeding: {} users, {} opinions per user",
      userCount,
      opinionsPerUser
    );

    List<User> users = new ArrayList<>(userCount);
    for (int i = 1; i <= userCount; i++) {
      String email = "seeduser" + i + "@example.com";
      String password = "password" + i;
      String displayName = "시드유저" + i;

      User user = new User(email, password, displayName);
      users.add(user);
    }
    userRepository.saveAll(users);

    List<Opinion> opinions = new ArrayList<>(userCount * opinionsPerUser);
    for (User user : users) {
      for (int i = 1; i <= opinionsPerUser; i++) {
        String content = "시드 의견 " + i + " - user=" + user.getEmail();
        opinions.add(new Opinion(user, content));
      }
    }
    opinionRepository.saveAll(opinions);

    seedAgendasRelated(users, opinions);
    seedOpinionSocial(users, opinions);

    log.info(
      "Completed opinion data seeding: {} users, {} opinions",
      users.size(),
      opinions.size()
    );
  }

  /** DevAgendaSeedController 와 유사한 안건·타임라인·북마크·투표·클러스터(opinion_cluster) 시드 */
  private void seedAgendasRelated(List<User> users, List<Opinion> opinions) {
    User writer = users.get(0);

    Agenda a1 = new Agenda(
      "읍내 주차장 확충 및 야간 무료 개방",
      "읍내 중심가 주차 공간을 확충하고, 야간에는 주민들에게 무료로 개방합니다.",
      writer
    );
    a1.setAgendaStatus(AgendaStatus.VOTING);
    a1.updateReferences(
      List.of("https://ocmaru.example/parking-plan"),
      List.of("/files/parking-plan.pdf"),
      null,
      null
    );
    a1.setThumbnail("/images/agendas/parking.jpg");
    a1.increaseViewCount(seedProperties.getAgendaViewCount1());

    Agenda a2 = new Agenda(
      "어린이 놀이터 안전시설 개선",
      "노후된 놀이터 시설을 교체하고 CCTV 및 안전 울타리를 설치합니다.",
      writer
    );
    a2.setAgendaStatus(AgendaStatus.VOTING);
    a2.updateReferences(
      List.of("https://ocmaru.example/playground-safety"),
      List.of("/files/playground-safety.hwp"),
      null,
      null
    );
    a2.setThumbnail("/images/agendas/playground.jpg");
    a2.increaseViewCount(seedProperties.getAgendaViewCount2());

    Agenda a3 = new Agenda(
      "야간 보안등 추가 설치",
      "어두운 골목과 보행로에 LED 보안등을 추가로 설치합니다.",
      writer
    );
    a3.setAgendaStatus(AgendaStatus.VOTING);
    a3.updateReferences(
      List.of("https://ocmaru.example/street-light"),
      List.of(),
      null,
      null
    );
    a3.setThumbnail("/images/agendas/light.jpg");
    a3.increaseViewCount(seedProperties.getAgendaViewCount3());

    List<Agenda> agendas = List.of(a1, a2, a3);
    agendaRepository.saveAll(agendas);

    AgendaTimelineItem t1 = new AgendaTimelineItem(
      a1,
      writer,
      "주차장 부지 확보를 위한 실태 조사를 완료했습니다.",
      null
    );
    t1.setAuthorName("옥천군청 도시과");

    AgendaTimelineItem t2 = new AgendaTimelineItem(
      a1,
      writer,
      "설계 용역을 발주했고, 7월 중 설계가 완료될 예정입니다.",
      null
    );
    t2.setAuthorName("옥천군청 도시과");

    AgendaTimelineItem t3 = new AgendaTimelineItem(
      a2,
      writer,
      "놀이터 노후 시설 점검을 완료하고 교체 목록을 확정했습니다.",
      null
    );
    t3.setAuthorName("옥천군청 복지과");

    AgendaTimelineItem t4 = new AgendaTimelineItem(
      a3,
      writer,
      "야간이 어두운 구간 23곳을 선정했습니다.",
      null
    );
    t4.setAuthorName("옥천군청 안전총괄과");

    agendaTimelineItemRepository.saveAll(List.of(t1, t2, t3, t4));

    int bookmarkUsers = Math.min(
      users.size(),
      seedProperties.getBookmarkUsersMax()
    );
    List<AgendaBookmark> bookmarks = new ArrayList<>();
    for (Agenda agenda : agendas) {
      for (int u = 0; u < bookmarkUsers; u++) {
        bookmarks.add(new AgendaBookmark(agenda, users.get(u)));
      }
    }
    agendaBookmarkRepository.saveAll(bookmarks);

    AgendaVoteType[] voteTypes = AgendaVoteType.values();
    int votersPerAgenda = Math.min(
      users.size(),
      seedProperties.getVotersPerAgendaMax()
    );
    for (Agenda agenda : agendas) {
      for (int v = 0; v < votersPerAgenda; v++) {
        User voter = users.get(v);
        AgendaVoteType vt = voteTypes[v % voteTypes.length];
        agendaVoteRepository.save(new AgendaVotes(agenda, voter, vt));
        agenda.increaseVoteCount(1);
      }
    }

    int slotsPerAgenda = Math.max(1, seedProperties.getClustersPerAgenda());
    int totalSlots = agendas.size() * slotsPerAgenda;
    List<List<Opinion>> buckets = new ArrayList<>(totalSlots);
    for (int i = 0; i < totalSlots; i++) {
      buckets.add(new ArrayList<>());
    }
    for (int i = 0; i < opinions.size(); i++) {
      buckets.get(i % totalSlots).add(opinions.get(i));
    }

    List<Cluster> clusterBatch = new ArrayList<>();
    List<Integer> nonEmptyBucketIndices = new ArrayList<>();
    for (int i = 0; i < totalSlots; i++) {
      if (buckets.get(i).isEmpty()) {
        continue;
      }
      nonEmptyBucketIndices.add(i);
      Agenda agenda = agendas.get(i / slotsPerAgenda);
      List<Opinion> bucket = buckets.get(i);
      clusterBatch.add(
        new Cluster(
          agenda,
          "시드 클러스터 " + (i + 1),
          "유사 의견 묶음 (시드 데이터)",
          seedProperties.getClusterSimilarityBase() +
          (i % Math.max(1, seedProperties.getClusterSimilaritySpread())),
          bucket.size()
        )
      );
    }
    if (!clusterBatch.isEmpty()) {
      clusterBatch = clusterRepository.saveAll(clusterBatch);
      for (int j = 0; j < clusterBatch.size(); j++) {
        Cluster cluster = clusterBatch.get(j);
        for (Opinion op : buckets.get(nonEmptyBucketIndices.get(j))) {
          op.addCluster(cluster);
        }
      }
      opinionRepository.saveAll(opinions);
    }
  }

  /** 의견 좋아요·댓글·댓글 좋아요 시드 */
  private void seedOpinionSocial(List<User> users, List<Opinion> opinions) {
    if (users.isEmpty() || opinions.isEmpty()) {
      return;
    }

    int likeCap = Math.min(
      opinions.size(),
      seedProperties.getOpinionLikesMax()
    );
    List<Opinion> toRefreshLikes = new ArrayList<>();
    for (int i = 0; i < likeCap; i++) {
      Opinion op = opinions.get(i);
      User liker = findOtherUser(users, op.getUser());
      if (liker == null) {
        continue;
      }
      op.increaseLikes();
      toRefreshLikes.add(op);
      opinionLikeRepository.save(new OpinionLike(op, liker));
    }
    if (!toRefreshLikes.isEmpty()) {
      opinionRepository.saveAll(toRefreshLikes);
    }

    int commentCap = Math.min(
      opinions.size(),
      seedProperties.getOpinionCommentsMax()
    );
    List<OpinionComment> comments = new ArrayList<>();
    for (int i = 0; i < commentCap; i++) {
      Opinion op = opinions.get(i);
      User commenter = users.get((i + 1) % users.size());
      comments.add(
        new OpinionComment(
          op,
          commenter,
          "시드 댓글 " + (i + 1) + " — 공감합니다."
        )
      );
    }
    opinionCommentRepository.saveAll(comments);

    List<OpinionCommentLike> commentLikes = new ArrayList<>();
    for (int i = 0; i < comments.size(); i++) {
      OpinionComment c = comments.get(i);
      User liker = findOtherUser(users, c.getUser());
      if (liker == null) {
        continue;
      }
      commentLikes.add(new OpinionCommentLike(c, liker));
    }
    if (!commentLikes.isEmpty()) {
      opinionCommentLikeRepository.saveAll(commentLikes);
    }
  }

  private static User findOtherUser(List<User> users, User exclude) {
    if (users.size() < 2) {
      return null;
    }
    for (User u : users) {
      if (!u.getId().equals(exclude.getId())) {
        return u;
      }
    }
    return null;
  }
}
