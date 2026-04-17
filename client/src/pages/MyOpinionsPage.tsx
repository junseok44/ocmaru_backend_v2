import Header from "@/components/Header";
import OpinionCard from "@/components/OpinionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { getUserDisplayName } from "@/utils/user";

interface Opinion {
  id: string;
  userId: string;
  type: string;
  content: string;
  voiceUrl: string | null;
  likes: number;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  commentCount: number;
  isLiked: boolean;
}

export default function MyOpinionsPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useUser();

  const { data: opinions, isLoading, isError } = useQuery<Opinion[]>({
    queryKey: ['/api/opinions/my'],
    enabled: !isUserLoading && !!user,
  });

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/my')}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <h2 className="text-2xl font-bold mb-6">내가 쓴 주민 의견</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/my');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/my")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <h2 className="text-2xl font-bold mb-6">내가 쓴 주민 의견</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">데이터를 불러오는데 실패했습니다.</p>
          </div>
        ) : !opinions || opinions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">아직 작성한 의견이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opinions.map((opinion) => (
              <OpinionCard
                key={opinion.id}
                id={opinion.id}
                authorName={getUserDisplayName(opinion.displayName, opinion.username)}
                content={opinion.content}
                likeCount={opinion.likes}
                commentCount={opinion.commentCount}
                isLiked={opinion.isLiked}
                timestamp={formatDistanceToNow(new Date(opinion.createdAt), { 
                  addSuffix: true, 
                  locale: ko 
                })}
                isAuthor={true}
                onClick={() => setLocation(`/opinion/${opinion.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
