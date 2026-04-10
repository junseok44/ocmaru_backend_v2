FROM prom/prometheus:v2.55.0

COPY prometheus.yml.template /etc/prometheus/prometheus.yml.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
# prom/prometheus 이미지 기본 사용자는 non-root라 chmod가 실패할 수 있음.
USER root
RUN chmod +x /docker-entrypoint.sh
USER nobody

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--storage.tsdb.path=/prometheus", "--storage.tsdb.retention.time=7d"]
