import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Edit, ArrowLeft, Share2, Copy, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import type { Agenda, Category } from "@shared/schema";
import { useState, useEffect } from "react";
import { trackShare } from "@/lib/analytics";
import { getEnv } from "@/lib/env";

interface AgendaHeaderProps {
  agenda: Agenda & { category?: Category; isBookmarked?: boolean };
  user?: { isAdmin?: boolean };
  onBookmarkClick: () => void;
  onEditClick?: () => void;
  bookmarkLoading?: boolean;
  showBackButton?: boolean;
}

export default function AgendaHeader({
  agenda,
  user,
  onBookmarkClick,
  onEditClick,
  bookmarkLoading = false,
  showBackButton = true, // 🚀 [수정] 기본값을 true로 변경하여 항상 보이게 함
}: AgendaHeaderProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendas/${agenda.id}`
    : '';
  const shareTitle = agenda.title;
  const shareText = agenda.description || agenda.title;

  // 카카오 SDK 초기화
  useEffect(() => {
    const initKakaoSDK = () => {
      if (typeof window === "undefined" || !window.Kakao) {
        return false;
      }
      if (window.Kakao.isInitialized()) {
        return true;
      }
      const kakaoKey = getEnv("VITE_KAKAO_JAVASCRIPT_KEY") || "";
      if (!kakaoKey) {
        return false;
      }
      try {
        window.Kakao.init(kakaoKey);
        return window.Kakao.isInitialized();
      } catch (error) {
        return false;
      }
    };

    if (initKakaoSDK()) {
      return;
    }

    const waitForKakaoSDK = (retries = 50) => {
      if (retries <= 0) return;
      if (typeof window !== "undefined" && window.Kakao) {
        initKakaoSDK();
      } else {
        setTimeout(() => waitForKakaoSDK(retries - 1), 100);
      }
    };

    const existingScript = document.querySelector('script[src*="kakao"]');
    if (existingScript) {
      waitForKakaoSDK();
    } else {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = () => {
        initKakaoSDK();
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleShare = async (platform: 'kakao' | 'copy') => {
    trackShare(agenda.id, platform === 'kakao' ? 'kakao' : 'copy');
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // ignore
      }
      return;
    }

    if (platform === 'kakao') {
      if (typeof window === "undefined" || !window.Kakao) {
        alert("카카오톡 SDK가 로드되지 않았습니다.");
        return;
      }

      if (!window.Kakao.isInitialized()) {
        const kakaoKey = getEnv("VITE_KAKAO_JAVASCRIPT_KEY") || "";
        if (kakaoKey) {
          try {
            window.Kakao.init(kakaoKey);
          } catch (error) {
            alert("카카오톡 SDK 초기화 실패");
            return;
          }
        } else {
          return;
        }
      }

      const kakaoShare = window.Kakao.Share || window.Kakao.Link;
      if (!kakaoShare || !kakaoShare.sendDefault) {
        alert("카카오톡 공유 기능을 사용할 수 없습니다.");
        return;
      }

      try {
        kakaoShare.sendDefault({
          objectType: 'feed',
          content: {
            title: agenda.title,
            description: agenda.description || '내용을 확인해보세요.',
            imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: '자세히 보기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        });
      } catch (error) {
        alert("카카오톡 공유 중 오류가 발생했습니다.");
      }
    }
  };

  const handleNativeShare = async () => {
    trackShare(agenda.id, 'native');
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // ignore
      }
    } else {
      handleShare('copy');
    }
  };

  return (
    <div className="space-y-4 w-full">


      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {/* 🚀 [수정] 카테고리 뱃지 색상 변경 (파란 계열 반투명) */}
          <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 border-0 backdrop-blur-sm px-3 py-1">
            {agenda.category?.name || "기타"}
          </Badge>
          
          <Badge className={`border ${getStatusBadgeClass(agenda.status)}`}>
            {getStatusLabel(agenda.status)}
          </Badge>
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold flex-1 text-white drop-shadow-md" data-testid="text-agenda-title">
            {agenda.title}
          </h1>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {user?.isAdmin && onEditClick && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onEditClick}
                data-testid="button-edit-agenda"
                className="w-10 h-10 hover:bg-white/10 text-white transition-colors rounded-full"
              >
                <Edit className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              size="icon"
              variant="ghost"
              onClick={onBookmarkClick}
              disabled={bookmarkLoading}
              data-testid="button-bookmark"
              className="w-10 h-10 hover:bg-white/10 text-white transition-colors rounded-full"
            >
              <Bookmark
                className={`w-6 h-6 ${agenda?.isBookmarked ? "fill-current text-ok_yellow" : ""}`}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-share"
                  className="w-10 h-10 hover:bg-white/10 text-white transition-colors rounded-full"
                >
                  <Share2 className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              {/* 🚀 [수정] 불필요한 ')}' 문법 오류 삭제 */}
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleNativeShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  공유하기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('kakao')}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  카카오톡
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? '복사됨!' : '링크 복사'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}