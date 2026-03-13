# Observability Stack (Local Dev)

This project uses:

- Spring Boot Actuator
- Micrometer + Prometheus registry
- Prometheus
- Grafana

## Endpoints

- Actuator health: `http://localhost:8080/actuator/health`
- Prometheus scrape endpoint: `http://localhost:8080/actuator/prometheus`
- Prometheus UI: `http://localhost:9090`
- Grafana UI: `http://localhost:3000` (`admin` / `admin`)

## Run

```bash
docker compose -f docker-compose.dev.yml up
```

## Security note (before production)

Current setup is for local development convenience.
Before production, protect `/actuator/**` with authentication and network restrictions.
