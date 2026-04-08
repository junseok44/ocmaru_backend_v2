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
   * 메인 서버: 비어 있으면 /api/internal/worker/** 에 X-Internal-Api-Key 검증 생략(로컬).
   * {@code worker} 프로필: 필수(기동 시 검증 + 헤더 일치).
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
