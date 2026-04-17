import { MessageSquare, Heart } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import LoginDialog from "@/components/LoginDialog";
import { useToast } from "@/hooks/use-toast";

interface HomeOpinionCardProps {
  opinion: {
    id: string;
    content: string;
    createdAt: string | Date;
    likes: number;
  };
  onClick: () => void;
}

export default function HomeOpinionCard({ opinion, onClick }: HomeOpinionCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // 로그인 팝업 상태
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // 좋아요 상태 (낙관적 UI를 위해 로컬 상태 사용)
  // 실제로는 내가 좋아요를 눌렀는지 여부(isLiked)를 서버에서 받아와야 정확하지만,
  // 홈 화면(미리보기)에서는 단순 증감 효과만 보여주는 경우가 많습니다.
  // 여기서는 단순히 누르면 +1, 다시 누르면 -1 되는 토글 효과를 구현합니다.
  const [likes, setLikes] = useState(opinion.likes);
  const [isLiked, setIsLiked] = useState(false); // 초기값은 false로 가정 (API 데이터에 isLiked가 없으므로)

  const likeMutation = useMutation({
    mutationFn: async () => {
      // API 호출 (좋아요 토글)
      const method = isLiked ? "DELETE" : "POST";
      await apiRequest(method, `/api/opinions/${opinion.id}/like`, { userId: user?.id });
    },
    onSuccess: () => {
      // 쿼리 무효화 (데이터 최신화)
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      // 에러 시 롤백
      setLikes(isLiked ? likes + 1 : likes - 1);
      setIsLiked(!isLiked);
      toast({
        title: "오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭(상세 이동) 방지

    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    // 낙관적 UI 업데이트 (즉시 반영)
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
    }

    // 서버 요청
    likeMutation.mutate();
  };

  return (
    <>
      <div 
        className="min-w-[240px] w-full bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:border-ok_sub1 hover:shadow-md transition-all cursor-pointer text-left group"
        onClick={onClick}
      >
        <div className="mb-3">
          <p className="text-ok_txtgray2 font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {opinion.content}
          </p>
        </div>
        
        <div className="flex justify-between items-center text-xs text-ok_txtgray0 mt-2">
          <span>{new Date(opinion.createdAt).toLocaleDateString()}</span>
          
          <button 
            onClick={handleLikeClick}
            className="flex items-center gap-1 hover:bg-gray-100 px-1.5 py-1 rounded-full transition-colors"
          >
            <Heart 
              className={`w-3.5 h-3.5 transition-colors ${isLiked ? "fill-ok_like text-ok_like" : "text-ok_like group-hover:text-ok_like"}`} 
            />
            <span className={`font-medium ${isLiked ? "text-ok_like" : ""}`}>
              {likes}
            </span>
          </button>
        </div>
      </div>

      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen} 
      />
    </>
  );
}