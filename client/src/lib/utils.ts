import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "created":
      return "안건 생성";
    case "rejected":
      return "반려됨";
    case "voting":
      return "투표 중";
    case "proposing":
      return "제안 중";
    case "answered":
      return "답변 완료";
    case "executing":
      return "실행 중";
    case "executed":
      return "실행 완료";
    default:
      return status;
  }
}

// 🚀 [수정] 두 번째 인자 type 추가 (기본값 'default')
// 'default'일 때는 기존 코드 그대로, 'soft'일 때는 밝은 배경용 스타일 반환
export function getStatusBadgeClass(status: string, type: 'default' | 'soft' = 'default'): string {
  
  // 1. [새로 추가된 부분] 밝은 카드용 스타일 (AgendaCard용)
  // 기존 색상 테마(파랑, 보라, 오렌지 등)는 유지하되, 배경은 연하게, 글자는 진하게 변경
  if (type === 'soft') {
    switch (status) {
      case "created":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "voting":
        return "bg-ok_subtrns text-ok_sub1 border-ok_sub1";
      case "proposing":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "answered":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "executing":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "executed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  // 2. [기존 코드 유지] 어두운 배경용 스타일 (OkAgendaCard용)
  switch (status) {
    case "created":
      return "bg-gray-500/10 text-gray-200 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    case "rejected":
      return "bg-red-500/10 text-red-200 dark:text-red-400 border-red-200 dark:border-red-800";
    case "voting":
      return "bg-blue-500/10 text-blue-200 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "proposing":
      return "bg-purple-500/10 text-purple-200 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "answered":
      return "bg-cyan-500/10 text-cyan-200 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
    case "executing":
      return "bg-orange-500/10 text-orange-200 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "executed":
      return "bg-green-500/10 text-green-200 dark:text-green-400 border-green-200 dark:border-green-800";
    default:
      return "bg-gray-500/10 text-gray-200 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
}