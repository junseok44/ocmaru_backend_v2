-- Hibernate ddl-auto 로 생성되던 스키마와 동등하도록 정리한 초기 마이그레이션.
-- 이미 테이블이 있는 DB에는 baseline-on-migrate 로 V1 이 스킵될 수 있다.

CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255),
  auth_provider VARCHAR(255) NOT NULL,
  provder_id VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(255),
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE agenda (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMP(6) NOT NULL,
  updated_at    TIMESTAMP(6) NOT NULL,
  writer_id     BIGINT NOT NULL REFERENCES users (id),
  title         VARCHAR(255) NOT NULL,
  description   VARCHAR(200) NOT NULL,
  agenda_status VARCHAR(255),
  vote_count    INTEGER NOT NULL DEFAULT 0,
  view_count    INTEGER NOT NULL DEFAULT 0,
  thumbnail     VARCHAR(255),
  okinews_url   VARCHAR(255)
);

CREATE TABLE agenda_reference_links (
  agenda_id BIGINT NOT NULL REFERENCES agenda (id),
  link      VARCHAR(255)
);

CREATE TABLE agenda_reference_files (
  agenda_id BIGINT NOT NULL REFERENCES agenda (id),
  file      VARCHAR(255)
);

CREATE TABLE agenda_regional_cases (
  agenda_id BIGINT NOT NULL REFERENCES agenda (id),
  tag       VARCHAR(255)
);

CREATE TABLE cluster (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMP(6) NOT NULL,
  updated_at     TIMESTAMP(6) NOT NULL,
  agenda_id      BIGINT REFERENCES agenda (id),
  title          VARCHAR(255) NOT NULL,
  summary        VARCHAR(255) NOT NULL,
  cluster_status INTEGER,
  opinion_count  INTEGER NOT NULL DEFAULT 0,
  similarity     INTEGER
);

CREATE TABLE cluster_tags (
  agenda_id BIGINT NOT NULL REFERENCES cluster (id),
  tags      VARCHAR(255)
);

CREATE TABLE opinion (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  user_id    BIGINT NOT NULL REFERENCES users (id),
  type       VARCHAR(255) NOT NULL,
  content    VARCHAR(255) NOT NULL,
  voice_url  VARCHAR(255),
  likes      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE opinion_cluster (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMP(6) NOT NULL,
  updated_at  TIMESTAMP(6) NOT NULL,
  cluster_id  BIGINT REFERENCES cluster (id),
  opinion_id  BIGINT REFERENCES opinion (id),
  CONSTRAINT uk_opinion_cluster UNIQUE (opinion_id, cluster_id)
);

CREATE TABLE opinion_like (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  opinion_id BIGINT REFERENCES opinion (id),
  user_id    BIGINT REFERENCES users (id),
  CONSTRAINT uk_opinion_like UNIQUE (opinion_id, user_id)
);

CREATE TABLE opinion_comment (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  opinion_id BIGINT REFERENCES opinion (id),
  user_id    BIGINT REFERENCES users (id),
  content    VARCHAR(255) NOT NULL
);

CREATE TABLE opinion_comment_like (
  id                  BIGSERIAL PRIMARY KEY,
  created_at          TIMESTAMP(6) NOT NULL,
  updated_at          TIMESTAMP(6) NOT NULL,
  opinion_comment_id  BIGINT REFERENCES opinion_comment (id),
  user_id               BIGINT REFERENCES users (id),
  CONSTRAINT uk_opinion_comment_like UNIQUE (opinion_comment_id, user_id)
);

CREATE TABLE report (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMP(6) NOT NULL,
  updated_at  TIMESTAMP(6) NOT NULL,
  reporter_id BIGINT REFERENCES users (id),
  reason      VARCHAR(200) NOT NULL,
  content     VARCHAR(1000),
  target_type VARCHAR(30),
  target_id   BIGINT,
  status      VARCHAR(20) NOT NULL
);

CREATE TABLE agenda_timeline_item (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMP(6) NOT NULL,
  updated_at  TIMESTAMP(6) NOT NULL,
  agenda_id   BIGINT NOT NULL REFERENCES agenda (id),
  user_id     BIGINT NOT NULL REFERENCES users (id),
  author_name VARCHAR(200) NOT NULL DEFAULT '작성자',
  content     VARCHAR(200) NOT NULL,
  image_url   VARCHAR(255)
);

CREATE TABLE agenda_bookmark (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  agenda_id  BIGINT REFERENCES agenda (id),
  user_id    BIGINT REFERENCES users (id),
  CONSTRAINT uk_agenda_bookmark UNIQUE (agenda_id, user_id)
);

CREATE TABLE agenda_votes (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  agenda_id  BIGINT NOT NULL REFERENCES agenda (id),
  user_id    BIGINT NOT NULL REFERENCES users (id),
  vote_type  VARCHAR(255) NOT NULL,
  CONSTRAINT uk_agenda_votes UNIQUE (agenda_id, user_id)
);
