#!/bin/sh
set -e
URL="${GRAFANA_PROMETHEUS_DATASOURCE_URL:-http://prometheus:9090}"
mkdir -p /etc/grafana/provisioning/datasources /etc/grafana/provisioning/dashboards
sed "s|__PROMETHEUS_URL__|${URL}|g" /etc/grafana/templates/datasources/datasource.yml.template \
  > /etc/grafana/provisioning/datasources/datasource.yml
cp /etc/grafana/templates/dashboards/dashboards.yaml /etc/grafana/provisioning/dashboards/dashboards.yaml
chown -R 472:472 /etc/grafana/provisioning
exec /run.sh
