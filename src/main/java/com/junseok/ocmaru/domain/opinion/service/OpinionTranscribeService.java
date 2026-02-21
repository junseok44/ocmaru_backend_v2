package com.junseok.ocmaru.domain.opinion.service;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OpinionTranscribeService {

  private static final String OPENAI_WHISPER_MODEL = "whisper-1";
  private static final String OPENAI_WHISPER_LANGUAGE = "ko";

  private final RestTemplate restTemplate;
  private final String apiKey;
  private final String whisperUrl;

  public OpinionTranscribeService(
    RestTemplate restTemplate,
    @Value("${app.openai.api-key}") String apiKey,
    @Value("${app.openai.whisper-url}") String whisperUrl
  ) {
    this.restTemplate = restTemplate;
    this.apiKey = apiKey;
    this.whisperUrl = whisperUrl;
  }

  /**
   * 오디오 파일을 OpenAI Whisper API로 전송하여 텍스트로 변환합니다.
   *
   * @param audio 업로드된 오디오 파일 (null이거나 비어 있으면 예외)
   * @return 변환된 텍스트
   */
  public String transcribe(MultipartFile audio) {
    if (audio == null || audio.isEmpty()) {
      throw new IllegalArgumentException("No audio file provided");
    }
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("OpenAI API key is not configured");
    }

    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", createAudioResource(audio));
    body.add("model", OPENAI_WHISPER_MODEL);
    body.add("language", OPENAI_WHISPER_LANGUAGE);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    headers.setBearerAuth(apiKey);

    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(
      body,
      headers
    );

    try {
      ResponseEntity<WhisperResponse> response = restTemplate.postForEntity(
        whisperUrl,
        requestEntity,
        WhisperResponse.class
      );

      if (response.getBody() == null || response.getBody().text() == null) {
        throw new IllegalStateException("Transcription failed");
      }
      return response.getBody().text();
    } catch (RestClientException e) {
      throw new IllegalStateException("Transcription failed", e);
    }
  }

  private Resource createAudioResource(MultipartFile audio) {
    try {
      byte[] bytes = audio.getBytes();
      String filename = audio.getOriginalFilename();
      if (filename == null || filename.isBlank()) {
        filename = "audio.webm";
      }
      final String finalFilename = filename;
      return new ByteArrayResource(bytes) {
        @Override
        public String getFilename() {
          return finalFilename;
        }
      };
    } catch (IOException e) {
      throw new IllegalStateException("Failed to read audio file", e);
    }
  }

  /** OpenAI Whisper API 응답 본문 */
  private record WhisperResponse(String text) {}
}
