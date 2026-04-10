FROM grafana/grafana:11.2.0

USER root

COPY grafana/templates/ /etc/grafana/templates/
# grafana-data 볼륨이 /var/lib/grafana 를 덮어쓰므로 대시보드는 이미지 내 /etc 아래에 둠
COPY grafana/dashboards/ /etc/grafana/dashboards/ocmaru/
COPY grafana/docker-entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

ENTRYPOINT ["/custom-entrypoint.sh"]
