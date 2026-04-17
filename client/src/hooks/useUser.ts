import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch, clearAuthTokens, queryClient } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

export function useUser() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await authFetch("/api/auth/me");
        if (!response.ok) {
          return null;
        }
        const payload = await response.json();
        if (!payload || typeof payload !== "object") {
          return null;
        }
        return {
          ...payload,
          isAdmin: Boolean((payload as any).isAdmin ?? (payload as any).admin),
        } as User;
      } catch (error) {
        // DB 연결 에러 등으로 인한 실패는 조용히 처리
        console.error("[useUser] Failed to fetch user:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
    refetchOnMount: false, // 마운트 시 재요청 방지 (캐시된 데이터 사용)
    refetchOnReconnect: false, // 재연결 시 재요청 방지
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearAuthTokens();
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
