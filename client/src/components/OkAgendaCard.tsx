import { Badge } from "@/components/ui/badge";
import { Vote, Bookmark, HelpCircle } from "lucide-react";
import { useState } from "react";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import { useUser } from "@/hooks/useUser"; // 👈 추가
import LoginDialog from "@/components/LoginDialog"; // 👈 추가

interface OkAgendaCardProps {
  title: string;
  status: string;
  content: string;
  okinews: boolean;
  id: string;
  category: string;
  categoryIcon?: string | null;
  commentCount: number;
  bookmarkCount: number;
  isBookmarked?: boolean;
  imageUrl?: string | null;
  onClick?: () => void;
  // 🚀 [추가] 실제 북마크 API 호출을 위한 핸들러 (부모에서 전달)
  onBookmarkClick?: (isBookmarked: boolean) => void; 
}

export default function OkAgendaCard({
  title,
  status,
  content,
  okinews,
  category,
  categoryIcon,
  commentCount,
  bookmarkCount,
  isBookmarked,
  imageUrl,
  onClick,
  onBookmarkClick, // 🚀
}: OkAgendaCardProps) {
  const { user } = useUser(); // 👈 유저 정보 가져오기
  const [count, setCount] = useState(bookmarkCount);
  const [marked, setMarked] = useState(isBookmarked || false);
  const [isLoginOpen, setIsLoginOpen] = useState(false); // 👈 로그인 팝업 상태

  const handleBookmarkAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1️⃣ 로그인 체크
    if (!user) {
      setIsLoginOpen(true);
      return; // 로그인 안 되어 있으면 여기서 중단 (하트 안 바뀜)
    }

    // 2️⃣ 로컬 상태 업데이트 (낙관적 UI)
    if (marked) {
      setCount(count - 1);
      setMarked(false);
    } else {
      setCount(count + 1);
      setMarked(true);
    }

    // 3️⃣ 부모 핸들러 호출 (API 요청 등)
    if (onBookmarkClick) {
      onBookmarkClick(marked); // 현재 상태를 넘겨줌 (true면 해제 요청, false면 등록 요청)
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className="relative w-full h-full self-stretch rounded-[10px] overflow-hidden cursor-pointer group transition-transform hover:scale-[1.01]"
      >
        
        {/* ================= 배경 이미지 영역 ================= */}
        <div className="absolute inset-0 w-full h-full z-0">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt="background" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
            </>
          ) : (
            <div className="w-full h-full bg-blend-multiply bg-gradient-to-b from-neutral-200/50 to-neutral-700/50" />
          )}
        </div>

        {/* ================= 컨텐츠 영역 ================= */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between px-3 pt-3 pb-6 md:px-5 md:pt-6 md:pb-9">
          
          {/* 1. 최상단 영역 (카테고리 + 북마크 버튼) */}
          <div className="w-full flex justify-between items-start mb-4">
            <Badge
              variant="secondary"
              className="font-medium bg-ok_blacktrns hover:text-ok_sub1 text-white/50 hover:bg-white border-0 text-[10px] md:text-xs backdrop-blur-sm"
            >
              {categoryIcon ? (
                    <span className="mr-1 text-xs leading-none">{categoryIcon}</span>
                  ) : (
                    <HelpCircle className="w-3 h-3 mr-1" />
                  )}
              {category}
            </Badge>

            <div
              className="flex flex-col items-center justify-center gap-0.5 text-white/90 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full w-8 h-8 md:w-9 md:h-9 transition-colors cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleBookmarkAction} // 👈 핸들러 변경
                className="group flex items-center justify-center outline-none w-full h-full"
              >
                <Bookmark
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-active:scale-90 ${
                    marked
                      ? "fill-white text-white"
                      : "text-white/70 group-hover:text-white"
                  }`}
                />
              </button>
              <span className="absolute -bottom-3 text-[9px] md:text-[10px] font-medium text-white/80 leading-none drop-shadow-sm">
                {count}
              </span>
            </div>
          </div>

          {/* 2. 하단 정보 영역 */}
          <div className="flex flex-col justify-end items-start gap-1.5 mt-auto">
            
            {/* 상태 뱃지 등 */}
            <div className="flex flex-wrap items-center gap-1.5 text-white/90 mb-0.5">
              <Badge className={`text-[10px] backdrop-blur-sm ${getStatusBadgeClass(status)}`}>
                {getStatusLabel(status)}
              </Badge>

              {okinews && (
                <div className="px-1.5 bg-primary rounded-[3px] flex justify-center items-center ml-1 h-[22px] shadow-sm">
                  <div className="text-white text-[10px] font-medium leading-none">
                    옥천신문
                  </div>
                </div>
              )}

              <Badge 
                variant="secondary"
                className="bg-black/10 text-ok_sand border border-ok_sand backdrop-blur-md gap-1 px-2 py-0.5 h-[22px]"
              >
                <Vote className="w-3 h-3 opacity-90" />
                <span className="text-[10px] md:text-[11px] font-medium leading-none mt-[1px]">
                  {commentCount}
                </span>
              </Badge>
            </div>

            {/* 제목 */}
            <div className="w-full font-extrabold text-white text-xl leading-6 md:text-2xl md:leading-7 line-clamp-2 drop-shadow-md">
              {title}
            </div>

            {/* 내용 */}
            <div className="w-full text-white/90 text-[13px] md:text-[14px] leading-4 md:leading-5 line-clamp-2 drop-shadow-sm">
              {content}
            </div>

          </div>
        </div>
      </div>

      {/* 🚀 [추가] 로그인 다이얼로그 */}
      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen} 
      />
    </>
  );
}