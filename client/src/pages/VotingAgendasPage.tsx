import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { Agenda, Category } from "@shared/schema";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

export default function VotingAgendasPage() {
  const [, setLocation] = useLocation();

  const {
    data: agendas,
    isLoading,
    error,
  } = useQuery<AgendaWithCategory[]>({
    queryKey: ["/api/agendas"],
  });

  const votingAgendas = agendas?.filter(
    (agenda) => agenda.status === "voting"
  ) || [];

  return (
    <div className="h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold" data-testid="heading-voting-agendas">
              투표 진행 중
            </h1>
          </div>

          <div className="space-y-4 pb-6">
            {error ? (
              <div
                className="p-4 bg-destructive/10 text-destructive rounded-md text-center"
                data-testid="error-agendas"
              >
                안건 목록을 불러오는 데 실패했습니다.
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : votingAgendas.length > 0 ? (
              votingAgendas.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  id={agenda.id}
                  title={agenda.title}
                  category={agenda.category?.name || ""}
                  status={agenda.status}
                  commentCount={agenda.voteCount}
                  bookmarkCount={agenda.bookmarkCount || 0}
                  isBookmarked={agenda.isBookmarked || false}
                  onClick={() => setLocation(`/agendas/${agenda.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-20">
                <p
                  className="text-muted-foreground text-lg"
                  data-testid="text-no-voting-agendas"
                >
                  투표 진행 중인 안건이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
