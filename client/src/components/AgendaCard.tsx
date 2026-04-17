import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Vote, Bookmark, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatusBadgeClass, getStatusLabel } from "@/lib/utils";

// 🚀 [중요] useUser, LoginDialog, useState 삭제!
// AgendaCard는 순수하게 "보여주는 역할"만 해야 에러가 안 나고 성능도 좋아.

interface AgendaCardProps {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryIcon?: string | null;
  status: string;
  commentCount: number;
  bookmarkCount: number;
  isBookmarked?: boolean;
  imageUrl?: string | null;
  onClick?: () => void;
  onBookmarkClick?: (e: React.MouseEvent) => void; // 🚀 타입 수정 (이벤트 객체 전달)
}

export default function AgendaCard({
  id,
  title,
  content,
  category,
  categoryIcon,
  status,
  commentCount,
  bookmarkCount,
  isBookmarked = false,
  imageUrl,
  onClick,
  onBookmarkClick,
}: AgendaCardProps) {
  
  // 🚀 [삭제] 내부 상태 관리 로직 삭제 (부모가 다 해줌)

  return (
    <Card
      className="bg-ok_gray1 cursor-pointer hover:border-ok_sub1 hover-elevate active-elevate-2 relative overflow-hidden group h-36 w-full"
      onClick={onClick}
      data-testid={`card-agenda-${id}`}
    >
      <div className="flex h-full relative z-10">

        {/* 1️⃣ 왼쪽 이미지 영역 */}
        <div className="p-3 h-full flex-shrink-0">
          <div className="h-full aspect-square rounded-lg overflow-hidden relative border border-black/5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                <span className="text-[10px] font-medium">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 2️⃣ 오른쪽 전체 영역 */}
        <div className="flex-1 flex py-6 pr-3 pl-0 min-w-0">
          
          {/* 2-A. 텍스트 콘텐츠 영역 */}
          <div className="flex-1 flex flex-col min-w-0 justify-start gap-2">
            
            <div className="flex flex-col gap-1.5">
              {/* 제목 + 댓글 수 */}
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold leading-none truncate text-gray-900 pr-2" data-testid={`text-title-${id}`}>
                  {title}
                </h3>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0 bg-white/50 px-1.5 py-0.5 rounded-md">
                  <Vote className="w-3 h-3" />
                  <span>{commentCount}</span>
                </span>
              </div>

              {/* 배지 영역 */}
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-medium text-[10px] px-1.5 h-5 flex items-center bg-white border-gray-200">
                  {categoryIcon ? (
                    <span className="mr-1 text-xs leading-none">{categoryIcon}</span>
                  ) : (
                    <HelpCircle className="w-3 h-3 mr-1" />
                  )}
                  {category}
                </Badge>
                <Badge
                  className={`font-medium text-[10px] px-1.5 h-5 border ${getStatusBadgeClass(status, 'soft')}`}
                >
                  {getStatusLabel(status)}
                </Badge>
                {commentCount > 50 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-primary/30 text-primary bg-primary/5">
                    <TrendingUp className="w-3 h-3 mr-1" /> 인기
                  </Badge>
                )}
              </div>
            </div>

            {/* 안건 내용 */}
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {content}
            </p>
          </div>

          {/* 2-B. 북마크 영역 */}
          <div className="flex flex-col items-center justify-center pl-2 ml-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 방지
                onBookmarkClick?.(e); // 🚀 부모에게 이벤트 전달 (부모가 로그인 체크함)
              }}
              className="h-9 w-9 transition-colors rounded-full group"
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-ok_sub1 text-ok_sub1" : "text-ok_txtgray0 group-hover:text-ok_sub1"}`} />
            </Button>
            <span className="text-[10px] font-medium text-gray-400 mt-[-2px]">
              {bookmarkCount}
            </span>
          </div>

        </div>
      </div>
    </Card>
  );
}