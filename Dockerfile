FROM node:20-bookworm-slim AS client-builder
WORKDIR /workspace/client

# Build context is this repository root (server/).
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM eclipse-temurin:17-jdk-jammy AS server-builder
WORKDIR /workspace/server

COPY . ./
COPY --from=client-builder /workspace/client/dist/ ./src/main/resources/static/

RUN chmod +x ./gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

COPY --from=server-builder /workspace/server/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
