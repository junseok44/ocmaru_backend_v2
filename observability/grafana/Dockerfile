FROM grafana/grafana:11.2.0

USER root

COPY grafana/templates/ /etc/grafana/templates/
COPY grafana/dashboards/ /var/lib/grafana/dashboards/ocmaru/
COPY grafana/docker-entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

ENTRYPOINT ["/custom-entrypoint.sh"]
