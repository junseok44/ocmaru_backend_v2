-- 클러스터 생성 동시성 제어용 전역 락 테이블 (단일 행)
-- Hibernate ddl-auto=validate 환경에서 엔티티 존재 시 테이블이 반드시 필요합니다.

CREATE TABLE IF NOT EXISTS cluster_generate_global_lock (
  id INTEGER PRIMARY KEY
);

-- 단일 행(싱글톤) 보장: id=1
INSERT INTO cluster_generate_global_lock (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

