#!/bin/sh
set -e
TARGET="${PROMETHEUS_SCRAPE_TARGET:-server:8080}"
sed "s|__SCRAPE_TARGET__|${TARGET}|g" /etc/prometheus/prometheus.yml.template > /tmp/prometheus.yml
exec /bin/prometheus --config.file=/tmp/prometheus.yml "$@"
