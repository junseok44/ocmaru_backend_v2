-- 클러스터 생성 잡 메타데이터 저장

CREATE TABLE IF NOT EXISTS cluster_generate_jobs (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  cluster_created INTEGER,
  opinions_processed INTEGER,
  failure_message VARCHAR(2000),
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cluster_generate_job_user
  ON cluster_generate_jobs (user_id);

