#!/bin/sh
set -e
# /tmp/prometheus.yml 생성. 환경변수:
#   PROMETHEUS_SCRAPE_TARGET PROMETHEUS_SCRAPE_SCHEME
#   PROMETHEUS_SCRAPE_USERNAME PROMETHEUS_SCRAPE_PASSWORD (Spring ACTUATOR_METRICS_* 와 동일 권장)
TARGET="${PROMETHEUS_SCRAPE_TARGET:-server:8080}"
SCHEME="${PROMETHEUS_SCRAPE_SCHEME:-http}"
USER="${PROMETHEUS_SCRAPE_USERNAME:-prometheus}"
PASS="${PROMETHEUS_SCRAPE_PASSWORD:-}"

{
  echo "global:"
  echo "  scrape_interval: 15s"
  echo "  evaluation_interval: 15s"
  echo ""
  echo "scrape_configs:"
  echo "  - job_name: \"ocmaru-server\""
  echo "    metrics_path: \"/actuator/prometheus\""
  echo "    scheme: ${SCHEME}"
} > /tmp/prometheus.yml

if [ -n "$PASS" ]; then
  printf '    basic_auth:\n      username: "%s"\n      password: "%s"\n' "$USER" "$PASS" >> /tmp/prometheus.yml
fi

{
  echo "    static_configs:"
  echo "      - targets:"
  echo "          - \"${TARGET}\""
} >> /tmp/prometheus.yml

exec /bin/prometheus --config.file=/tmp/prometheus.yml "$@"
