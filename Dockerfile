FROM node:20-alpine AS client-builder
WORKDIR /workspace/client

# Build context must be the ocmaru root: docker build -f server/Dockerfile .
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM eclipse-temurin:17-jdk-alpine AS server-builder
WORKDIR /workspace/server

COPY server/ ./
COPY --from=client-builder /workspace/client/dist/ ./src/main/resources/static/

RUN chmod +x ./gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

COPY --from=server-builder /workspace/server/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
