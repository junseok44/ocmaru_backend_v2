package com.junseok.ocmaru.infra.openai;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenAiEmbeddingClient {

  private final RestClient restClient;
  private final String embeddingModel;

  public OpenAiEmbeddingClient(
    @Value("${app.openai.api-key}") String apiKey,
    @Value(
      "${app.openai.embedding-url:https://api.openai.com/v1/embeddings}"
    ) String embeddingUrl,
    @Value(
      "${app.openai.embedding-model:text-embedding-3-small}"
    ) String embeddingModel
  ) {
    this.embeddingModel = embeddingModel;
    this.restClient =
      RestClient
        .builder()
        .baseUrl(embeddingUrl)
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
        .defaultHeader(
          HttpHeaders.CONTENT_TYPE,
          MediaType.APPLICATION_JSON_VALUE
        )
        .build();
  }

  public Number[] getEmbedding(String input) {
    EmbeddingRequest body = new EmbeddingRequest(embeddingModel, input);

    EmbeddingResponse response = restClient
      .post()
      .body(body)
      .retrieve()
      .body(EmbeddingResponse.class);

    if (response == null || response.data == null || response.data.isEmpty()) {
      throw new IllegalStateException("임베딩 응답이 비어 있습니다.");
    }

    List<Double> vector = response.data.get(0).embedding;
    return vector.toArray(Number[]::new);
  }

  private record EmbeddingRequest(String model, String input) {}

  private record EmbeddingResponse(List<EmbeddingData> data) {}

  private record EmbeddingData(List<Double> embedding) {}
}
