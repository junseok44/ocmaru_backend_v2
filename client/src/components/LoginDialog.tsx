import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { useQuery } from "@tanstack/react-query";
  import { Loader2 } from "lucide-react";
  
  interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  
  export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
    // 1️⃣ 프로바이더 정보 가져오기 (이 로직을 컴포넌트 안으로 쏙!)
    const { data: providers, isLoading } = useQuery<{ google: boolean; kakao: boolean }>({
      queryKey: ["/api/auth/providers"],
      queryFn: async () => {
        const res = await fetch("/api/auth/providers");
        if (!res.ok) return { google: false, kakao: false };
        return res.json();
      },
      // 다이얼로그가 열려있을 때만 페칭
      enabled: open, 
    });
  
    const handleLogin = (provider: "google" | "kakao") => {
      window.location.href = `/api/auth/${provider}`;
    };
  
    const hasAnyProvider = providers?.google || providers?.kakao;
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          data-testid="dialog-login"
          className="bg-ok_gray1 sm:rounded-lg sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">로그인</DialogTitle>
            <DialogDescription className="text-center">
              {isLoading ? "로딩 중..." : 
               hasAnyProvider ? "소셜 계정으로 간편하게 로그인하세요" : "설정된 로그인 방식이 없습니다"}
            </DialogDescription>
          </DialogHeader>
  
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : hasAnyProvider ? (
            <>
              <div className="space-y-3 py-2">
                {/* 카카오 로그인 버튼 (노란색) */}
                {providers?.kakao && (
                  <Button
                    onClick={() => handleLogin("kakao")}
                    className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] border-none font-medium h-12 text-base relative justify-center"
                    data-testid="button-kakao-login"
                  >
                    {/* 카카오 SVG 아이콘 */}
                    <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C5.373 3 0 6.663 0 11.182C0 14.09 1.954 16.696 5.039 18.22L3.929 22.28C3.824 22.68 4.279 23.01 4.634 22.77L9.648 19.46C10.41 19.57 11.196 19.63 12 19.63C18.627 19.63 24 15.96 24 11.18C24 6.663 18.627 3 12 3Z"/>
                    </svg>
                    Kakao로 시작하기
                  </Button>
                )}
  
                {/* 구글 로그인 버튼 (흰색) */}
                {providers?.google && (
                  <Button
                    variant="outline"
                    onClick={() => handleLogin("google")}
                    className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium h-12 text-base relative justify-center"
                    data-testid="button-google-login"
                  >
                    {/* 구글 SVG 아이콘 */}
                    <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google로 시작하기
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                로그인하면 서비스 이용약관에 동의하게 됩니다
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              <p className="mb-3">관리자에게 문의하세요.<br/>(OAuth 설정 필요)</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }