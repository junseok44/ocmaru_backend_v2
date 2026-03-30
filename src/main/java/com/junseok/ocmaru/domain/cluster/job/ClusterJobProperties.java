package com.junseok.ocmaru.domain.cluster.job;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cluster.job")
public class ClusterJobProperties {

  /**
   * inline: 동일 애플리케이션에서 비동기 실행(로컬·단일 인스턴스).
   * http: 워커 URL로 HTTP POST(Cloud Run 등 서버리스 워커).
   */
  private DispatchMode dispatchMode = DispatchMode.inline;

  /** dispatch-mode=http 일 때 필수. 예: https://cluster-worker-xxx.run.app (끝 슬래시 없음) */
  private String workerUrl = "";

  /**
   * 비어 있으면 내부 워커 경로 인증을 생략(로컬 전용).
   * 설정 시 /api/internal/worker/** 요청에 X-Internal-Api-Key 헤더 필요.
   */
  private String internalApiKey = "";

  /**
   * 테스트 등에서 인라인 디스패치를 동기로 실행해 경쟁을 없앰.
   */
  private boolean inlineSynchronous = false;

  public DispatchMode getDispatchMode() {
    return dispatchMode;
  }

  public void setDispatchMode(DispatchMode dispatchMode) {
    this.dispatchMode = dispatchMode;
  }

  public String getWorkerUrl() {
    return workerUrl;
  }

  public void setWorkerUrl(String workerUrl) {
    this.workerUrl = workerUrl;
  }

  public String getInternalApiKey() {
    return internalApiKey;
  }

  public void setInternalApiKey(String internalApiKey) {
    this.internalApiKey = internalApiKey;
  }

  public boolean isInlineSynchronous() {
    return inlineSynchronous;
  }

  public void setInlineSynchronous(boolean inlineSynchronous) {
    this.inlineSynchronous = inlineSynchronous;
  }

  public enum DispatchMode {
    inline,
    http,
  }
}
