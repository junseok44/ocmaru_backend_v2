package com.junseok.ocmaru.infra.openai;

import com.junseok.ocmaru.domain.cluster.dto.ClusterMetadataDto;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@Profile("!mock-openai")
public class OpenAiClusterMetadataClient implements ClusterMetadataClient {

  private final RestClient restClient;
  private final String chatModel;

  public OpenAiClusterMetadataClient(
    @Value("${app.openai.api-key}") String apiKey,
    @Value(
      "${app.openai.chat-url:https://api.openai.com/v1/chat/completions}"
    )
    String chatUrl,
    @Value("${app.openai.chat-model:gpt-4.1-mini}") String chatModel
  ) {
    this.chatModel = chatModel;
    this.restClient =
      RestClient
        .builder()
        .baseUrl(chatUrl)
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
        .defaultHeader(
          HttpHeaders.CONTENT_TYPE,
          MediaType.APPLICATION_JSON_VALUE
        )
        .build();
  }

  @Override
  public ClusterMetadataDto generateMetadata(List<String> opinions) {
    String joinedOpinions =
      opinions
        .stream()
        .map(content -> "- " + content)
        .collect(Collectors.joining("\n"));

    String userPrompt =
      """
      아래는 하나의 클러스터에 속한 여러 사용자의 의견 목록입니다.
      이 의견들을 대표하는 한국어 제목과 2~3문장 요약을 작성해 주세요.

      출력 형식:
      제목: <제목 한 줄>
      요약: <요약 한 단락>

      의견 목록:
      %s
      """
        .formatted(joinedOpinions);

    ChatRequest request = ChatRequest.of(chatModel, userPrompt);

    ChatResponse response =
      restClient.post().body(request).retrieve().body(ChatResponse.class);

    if (
      response == null ||
      response.choices == null ||
      response.choices.isEmpty()
    ) {
      throw new IllegalStateException("클러스터 메타데이터 응답이 비어 있습니다.");
    }

    String content = response.choices.get(0).message.content;
    ParsedMetadata parsed = ParsedMetadata.fromContent(content);

    return new ClusterMetadataDto(parsed.title, parsed.summary);
  }

  private record ChatRequest(String model, List<Message> messages) {

    public static ChatRequest of(String model, String userPrompt) {
      Message system =
        new Message(
          "system",
          "당신은 여러 의견을 읽고 대표 제목과 요약을 만드는 어시스턴트입니다."
        );
      Message user = new Message("user", userPrompt);
      return new ChatRequest(model, List.of(system, user));
    }
  }

  private record Message(String role, String content) {}

  private record ChatResponse(List<Choice> choices) {}

  private record Choice(Message message) {}

  private static final class ParsedMetadata {

    public final String title;
    public final String summary;

    private ParsedMetadata(String title, String summary) {
      this.title = title;
      this.summary = summary;
    }

    private static ParsedMetadata fromContent(String content) {
      if (content == null || content.isBlank()) {
        return new ParsedMetadata("제목 없음", "요약을 생성할 수 없습니다.");
      }

      String[] lines = content.split("\\R");
      String title = null;
      StringBuilder summaryBuilder = new StringBuilder();

      for (String line : lines) {
        String trimmed = line.trim();
        if (trimmed.startsWith("제목:")) {
          title = trimmed.substring("제목:".length()).trim();
        } else if (trimmed.startsWith("요약:")) {
          summaryBuilder.append(trimmed.substring("요약:".length()).trim());
        } else if (!trimmed.isEmpty()) {
          if (summaryBuilder.length() > 0) {
            summaryBuilder.append(" ");
          }
          summaryBuilder.append(trimmed);
        }
      }

      if (title == null || title.isBlank()) {
        title = "제목 없음";
      }
      String summary =
        summaryBuilder.length() > 0
          ? summaryBuilder.toString()
          : "요약을 생성할 수 없습니다.";

      return new ParsedMetadata(title, summary);
    }
  }
}

