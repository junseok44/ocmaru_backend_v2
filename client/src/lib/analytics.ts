// Google Analytics 4 유틸리티 함수

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * GA4 초기화
 * @param measurementId GA4 측정 ID (예: G-XXXXXXXXXX)
 */
export function initGA(measurementId: string) {
  if (typeof window === "undefined" || !measurementId) {
    return;
  }

  // 이미 초기화되어 있으면 스킵
  if (window.gtag) {
    return;
  }

  // gtag.js 스크립트 로드
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // dataLayer 및 gtag 초기화
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_path: window.location.pathname,
  });
}

/**
 * 페이지뷰 추적
 * @param path 페이지 경로
 */
export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  const measurementId = getMeasurementId();
  if (!measurementId) {
    return;
  }

  window.gtag("config", measurementId, {
    page_path: path,
  });
}

/**
 * 커스텀 이벤트 추적
 * @param eventName 이벤트 이름
 * @param eventParams 이벤트 파라미터
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, eventParams);
}

import { getEnv } from "./env";

/**
 * 환경 변수에서 측정 ID 가져오기
 */
function getMeasurementId(): string {
  return getEnv("VITE_GA_MEASUREMENT_ID") || "";
}

// 가설 검증을 위한 이벤트 추적 함수들

/**
 * 가설 1: 주민은 의견을 남길 의지가 있다
 * - 의견 작성 이벤트
 */
export function trackOpinionCreated(opinionType: "text" | "voice") {
  trackEvent("opinion_created", {
    opinion_type: opinionType,
  });
}

/**
 * 가설 2: 주민 간 상호작용이 일어난다
 */

// 좋아요 이벤트
export function trackOpinionLike(opinionId: string, action: "like" | "unlike") {
  trackEvent("opinion_like", {
    opinion_id: opinionId,
    action,
  });
}

// 답글 작성 이벤트
export function trackCommentCreated(opinionId: string) {
  trackEvent("comment_created", {
    opinion_id: opinionId,
  });
}

// 투표 이벤트
export function trackVote(
  agendaId: string,
  voteType: "agree" | "disagree" | "neutral"
) {
  trackEvent("vote", {
    agenda_id: agendaId,
    vote_type: voteType,
  });
}

// 즐겨찾기 이벤트
export function trackBookmark(
  agendaId: string,
  action: "bookmark" | "unbookmark"
) {
  trackEvent("bookmark", {
    agenda_id: agendaId,
    action,
  });
}

// 안건 댓글 이벤트 (안건에 대한 의견 작성)
export function trackAgendaComment(agendaId: string) {
  trackEvent("agenda_comment", {
    agenda_id: agendaId,
  });
}

// 공유 이벤트
export function trackShare(
  agendaId: string,
  shareMethod: "kakao" | "native" | "copy"
) {
  trackEvent("share", {
    agenda_id: agendaId,
    share_method: shareMethod,
  });
}

/**
 * 가설 3: 정책 흐름이 작동한다
 */

// 안건 생성 이벤트
export function trackAgendaCreated(agendaId: string) {
  trackEvent("agenda_created", {
    agenda_id: agendaId,
  });
}

