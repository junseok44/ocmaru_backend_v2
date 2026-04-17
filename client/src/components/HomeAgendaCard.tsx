import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils";
import { Image as ImageIcon, Bookmark, HelpCircle } from "lucide-react"; // Bookmark 아이콘 추가
import { useState } from "react"; // useState 추가

interface HomeAgendaCardProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  categoryIcon?: string | null;
  status: string;
  bookmarkCount: number; // ✨ [추가]
  isBookmarked?: boolean; // ✨ [추가]

  onClick?: () => void;
}

export default function HomeAgendaCard({
  title,
  description,
  imageUrl,
  category,
  categoryIcon,
  status,
  bookmarkCount, // ✨
  isBookmarked, // ✨
  onClick,
}: HomeAgendaCardProps) {
  // ✨ [추가] 북마크 상태 관리 (낙관적 업데이트)
  const [count, setCount] = useState(bookmarkCount);
  const [marked, setMarked] = useState(isBookmarked || false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭(페이지 이동) 방지
    if (marked) {
      setCount(count - 1);
      setMarked(false);
      // TODO: 실제 API 호출 로직은 필요하다면 여기에 추가
    } else {
      setCount(count + 1);
      setMarked(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 text-left flex flex-col"
    >
      {/* 1. 상단 이미지 영역 */}
      <div className="relative w-full h-[50%] shrink-0 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-12 h-12 opacity-50" />
          </div>
        )}

        {/* 상태 배지 (좌측 상단) */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm text-[10px] font-medium shadow-sm">
            {getStatusLabel(status)}
          </Badge>
        </div>

        {/* ✨ [추가] 북마크 버튼 (우측 상단) ✨ */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-ok_yellowtrns hover:bg-ok_yellowtrnslt backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm transition-all z-10 group/btn"
        >
          <Bookmark
            className={`w-3.5 h-3.5 transition-transform group-active/btn:scale-90 ${marked ? "fill-ok_yellow text-ok_yellow" : "text-ok_yellow"
              }`}
          />
          <span className={`text-[10px] font-bold leading-none ${marked ? "text-white" : "text-white"}`}>
            {count}
          </span>
        </button>
      </div>

      {/* 2. 하단 흰색 텍스트 영역 */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {/* 태그 (카테고리) */}
        <div className="flex items-center gap-1 mb-1">
          <Badge variant="outline" className="bg-white text-[12px] text-ok_txtgray1 border-gray-200 font-medium py-0.5">
            {categoryIcon ? (
              <span className="mr-1 text-xs leading-none">{categoryIcon}</span>
            ) : (
              <HelpCircle className="w-3 h-3 mr-1" />
            )}
            {category}
          </Badge>
        </div>

        {/* 제목 */}
        <h3 className="font-extrabold text-xl text-ok_txtgray2 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* 설명 */}
        <p className="text-sm text-ok_txtgray1 line-clamp-4 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}