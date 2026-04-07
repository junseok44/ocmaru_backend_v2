package com.junseok.ocmaru.infra.openai;

public interface EmbeddingClient {
  Number[] getEmbedding(String input);
}
