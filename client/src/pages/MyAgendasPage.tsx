import Header from "@/components/Header";
import AgendaCard from "@/components/AgendaCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";

interface Agenda {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string | null;
  status: string;
  voteCount: number;
  viewCount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function MyAgendasPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useUser();

  const { data: agendas, isLoading, isError } = useQuery<Agenda[]>({
    queryKey: ['/api/agendas/my-opinions'],
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
          <h2 className="text-2xl font-bold mb-6">내 의견이 포함된 안건</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
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
        <h2 className="text-2xl font-bold mb-6">내 의견이 포함된 안건</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-destructive">데이터를 불러오는데 실패했습니다.</p>
          </div>
        ) : !agendas || agendas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">내 의견이 포함된 안건이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendas.map((agenda) => (
              <AgendaCard
                key={agenda.id}
                id={agenda.id}
                title={agenda.title}
                category={agenda.categoryName || "기타"}
                status={agenda.status}
                commentCount={0}
                bookmarkCount={0}
                isBookmarked={false}
                onClick={() => setLocation(`/agendas/${agenda.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
