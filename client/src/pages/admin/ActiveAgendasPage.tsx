import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Loader2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ActiveAgenda = {
  id: string;
  title: string;
  description: string;
  status: "voting" | "reviewing" | "passed" | "rejected";
  voteCount: number;
  viewCount: number;
  commentCount: number;
  activityScore: number;
  categoryId: string;
  categoryName: string;
};

export default function ActiveAgendasPage() {
  const [, setLocation] = useLocation();

  const { data: activeAgendas = [], isLoading } = useQuery<ActiveAgenda[]>({
    queryKey: ["/api/admin/stats/active-agendas"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              활발한 안건
            </h1>
            <p className="text-muted-foreground mt-1">
              투표 수, 댓글 수, 조회 수를 반영한 상위 20개 안건
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" data-testid="button-info">
              <Info className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-info">
            <DialogHeader>
              <DialogTitle>활발한 안건 선정 기준</DialogTitle>
              <DialogDescription className="text-base pt-2">
                투표 수, 댓글 수, 조회 수가 모두 동등하게 반영되어 활발한 안건으로
                선정됩니다.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {activeAgendas.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground text-sm">안건이 없습니다</p>
          </Card>
        ) : (
          activeAgendas.map((agenda, index) => (
            <Card
              key={agenda.id}
              className="p-6 hover-elevate active-elevate-2"
              data-testid={`agenda-card-${agenda.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {agenda.categoryName}
                    </Badge>
                    <Badge
                      className={`${getStatusBadgeClass(agenda.status)} text-xs`}
                    >
                      {getStatusLabel(agenda.status)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {agenda.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {agenda.description}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="w-4 h-4" />
                      투표 {agenda.voteCount}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      댓글 {agenda.commentCount}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      조회 {agenda.viewCount}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <TrendingUp className="w-4 h-4" />
                      활동 점수: {agenda.activityScore}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation(`/agendas/${agenda.id}`)}
                  data-testid={`button-view-${agenda.id}`}
                >
                  자세히 보기
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
