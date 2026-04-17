// 런타임 환경변수 지원 (프로덕션용)
// 개발 모드에서는 Vite의 import.meta.env 사용
// 프로덕션에서는 window.__ENV__ 사용

declare global {
  interface Window {
    __ENV__?: {
      VITE_GA_MEASUREMENT_ID?: string;
      VITE_KAKAO_JAVASCRIPT_KEY?: string;
    };
  }
}

export function getEnv(key: string): string | undefined {
  // 개발 모드에서는 Vite의 import.meta.env 사용
  if (import.meta.env.DEV) {
    return (import.meta.env as Record<string, any>)[key] as string | undefined;
  }

  // 프로덕션에서는 window.__ENV__ 사용
  if (typeof window !== "undefined" && window.__ENV__) {
    return window.__ENV__[key as keyof typeof window.__ENV__];
  }

  return undefined;
}

