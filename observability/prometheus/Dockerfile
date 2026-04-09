FROM prom/prometheus:v2.55.0

COPY prometheus.yml.template /etc/prometheus/prometheus.yml.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--storage.tsdb.path=/prometheus", "--storage.tsdb.retention.time=7d"]
