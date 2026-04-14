FROM prom/prometheus:v2.55.0

# 설정은 docker-entrypoint.sh 가 /tmp/prometheus.yml 로 생성 (환경변수 참고)
COPY docker-entrypoint.sh /docker-entrypoint.sh
# prom/prometheus 이미지 기본 사용자는 non-root라 chmod가 실패할 수 있음.
USER root
RUN chmod +x /docker-entrypoint.sh
USER nobody

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--storage.tsdb.path=/prometheus", "--storage.tsdb.retention.time=7d"]
