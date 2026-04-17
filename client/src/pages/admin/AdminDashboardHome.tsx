import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, Opinion } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";
import { getUserDisplayName } from "@/utils/user";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useUser } from "@/hooks/useUser";

type DashboardStats = {
  today: {
    newOpinions: number;
    newUsers: number;
  };
  week: {
    newOpinions: number;
    newUsers: number;
  };
  activeAgendas: number;
  pendingReports: number;
  recentClusters: Array<{
    id: string;
    title: string;
    summary: string;
    opinionCount: number;
    similarity: number | null;
    createdAt: Date;
  }>;
};

type WeeklyOpinion = {
  date: string;
  day: string;
  count: number;
  isToday: boolean;
};

type OpinionWithUser = Opinion & {
  username: string;
  displayName: string | null;
};

export default function AdminDashboardHome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: weeklyOpinions = [], isLoading: weeklyLoading } = useQuery<WeeklyOpinion[]>({
    queryKey: ["/api/admin/stats/weekly-opinions"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: clusterOpinions = [], isLoading: clusterOpinionsLoading, error: clusterOpinionsError } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/clusters", expandedClusterId, "opinions"],
    queryFn: async () => {
      if (!expandedClusterId) return [];
      const response = await fetch(`/api/clusters/${expandedClusterId}/opinions`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch opinions: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!expandedClusterId,
  });

  const seedOpinionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dev/seed-opinions"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions/unclustered"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "의견 생성 완료",
        description: data.message || "100개의 의견이 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "의견 생성 실패",
        description: "의견 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const pendingReports = reports.filter((r) => r.status === "pending");

  // 비로그인 또는 관리자가 아닌 경우 홈으로 리다이렉트
  if (!isUserLoading && !user?.isAdmin) {
    setLocation("/");
    return null;
  }

  if (isUserLoading || statsLoading || reportsLoading || weeklyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">대시보드</h1>
          <p className="text-muted-foreground">
            주민참여 플랫폼의 주요 지표와 활동을 한눈에 확인하세요
          </p>
        </div>
        <Button
          onClick={() => seedOpinionsMutation.mutate()}
          disabled={seedOpinionsMutation.isPending}
          variant="outline"
          data-testid="button-seed-opinions"
        >
          {seedOpinionsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              테스트 의견 100개 생성
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-6 md:col-span-2 hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/admin/opinions/today")} data-testid="card-today-opinions">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">오늘의 주민 의견 동향</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyOpinions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            오늘 접수된 의견: {stats.today.newOpinions}건 (주간 총 {stats.week.newOpinions}건)
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/admin/active-agendas")} data-testid="card-active-agendas">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">활발한 안건</p>
            </div>
            <p className="text-3xl font-bold">{stats.activeAgendas}</p>
            <p className="text-xs text-muted-foreground mt-1">진행 중</p>
          </Card>

          <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/admin/opinions/reports")} data-testid="card-report-management">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <p className="text-sm font-medium text-muted-foreground">주민 의견 신고 관리</p>
            </div>
            <p className="text-3xl font-bold">{stats.pendingReports}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingReports.length}건 대기 중
            </p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              최근 생성된 클러스터
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/opinions/clusters")}
              data-testid="button-view-all-clusters"
            >
              전체 보기
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentClusters.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  생성된 클러스터가 없습니다
                </p>
              </Card>
            ) : (
              stats.recentClusters.map((cluster) => (
                <Card
                  key={cluster.id}
                  className="p-4"
                  data-testid={`cluster-card-${cluster.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-1">
                          {cluster.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {cluster.summary}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MessageSquare className="w-3 h-3" />
                            {cluster.opinionCount}개
                          </span>
                          {cluster.similarity !== null && (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Sparkles className="w-3 h-3" />
                              {cluster.similarity}%
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(cluster.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedClusterId(
                            expandedClusterId === cluster.id ? null : cluster.id
                          );
                        }}
                        data-testid={`button-view-cluster-${cluster.id}`}
                      >
                        {expandedClusterId === cluster.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            의견 숨기기
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            의견 보기
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/admin/agendas/new?clusterId=${cluster.id}&title=${encodeURIComponent(cluster.title)}&summary=${encodeURIComponent(cluster.summary)}`);
                        }}
                        data-testid={`button-create-agenda-${cluster.id}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        안건 생성
                      </Button>
                    </div>

                    {expandedClusterId === cluster.id && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-sm font-medium mb-2">관련 의견 ({clusterOpinions.length})</p>
                        {clusterOpinionsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                            <p className="text-sm text-muted-foreground">의견을 불러오는 중...</p>
                          </div>
                        ) : clusterOpinionsError ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-destructive">
                              의견을 불러오는 중 오류가 발생했습니다
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {clusterOpinionsError instanceof Error ? clusterOpinionsError.message : "알 수 없는 오류"}
                            </p>
                          </div>
                        ) : clusterOpinions.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">이 클러스터에 등록된 의견이 없습니다</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {clusterOpinions.map((opinion) => (
                              <div
                                key={opinion.id}
                                className="p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/opinion/${opinion.id}`);
                                }}
                                data-testid={`opinion-${opinion.id}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-medium">
                                    {getUserDisplayName(opinion.displayName, opinion.username)}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(opinion.createdAt), "MM/dd HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {opinion.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              미처리 신고
            </h2>
            <Badge variant="destructive">{pendingReports.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingReports.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  처리할 신고가 없습니다
                </p>
              </Card>
            ) : (
              pendingReports.slice(0, 5).map((report) => (
                <Card
                  key={report.id}
                  className="p-4 hover-elevate active-elevate-2"
                  data-testid={`urgent-item-${report.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {report.opinionId ? "의견" : "안건"}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          {report.reportType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {report.description || "사유 없음"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setLocation("/admin/opinions/reports")}
                      data-testid={`button-handle-${report.id}`}
                    >
                      처리하기
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
