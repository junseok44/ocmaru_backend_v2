import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ClusterWorkbench from "@/components/admin/ClusterWorkbench";
import ReportManagement from "@/components/admin/ReportManagement";
import AllOpinionsManagement from "@/components/admin/AllOpinionsManagement";
import TodayOpinionsPage from "@/pages/admin/TodayOpinionsPage";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Cluster, Opinion, Report } from "@shared/schema";

export default function AdminOpinionsPage() {
  const [, setLocation] = useLocation();
  const [matchClusters] = useRoute("/admin/opinions/clusters");
  const [matchReports] = useRoute("/admin/opinions/reports");
  const [matchToday] = useRoute("/admin/opinions/today");
  const [matchAll] = useRoute("/admin/opinions/all");

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: unclusteredOpinions = [] } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions/unclustered"],
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: allOpinions = [] } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions"],
  });

  const pendingReports = reports.filter((r) => r.status === "pending").length;

  if (matchClusters) {
    return <ClusterWorkbench />;
  }

  if (matchReports) {
    return <ReportManagement />;
  }

  if (matchToday) {
    return <TodayOpinionsPage />;
  }

  if (matchAll) {
    return <AllOpinionsManagement />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">주민 의견 관리</h1>
        <p className="text-muted-foreground">
          클러스터링, 신고 처리, 의견 관리 기능을 제공합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation("/admin/opinions/clusters")}
          data-testid="card-clusters"
        >
          <h3 className="font-semibold text-lg mb-2">클러스터 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            의견 클러스터를 관리하고 안건을 생성합니다
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">{clusters.length}개 클러스터</Badge>
            <Badge variant="outline">{unclusteredOpinions.length}개 미분류</Badge>
          </div>
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation("/admin/opinions/reports")}
          data-testid="card-reports"
        >
          <h3 className="font-semibold text-lg mb-2">신고 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            신고된 의견을 검토하고 조치합니다
          </p>
          {pendingReports > 0 ? (
            <Badge variant="destructive">{pendingReports}건 대기 중</Badge>
          ) : (
            <Badge variant="secondary">처리 완료</Badge>
          )}
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation("/admin/opinions/all")}
          data-testid="card-all-opinions"
        >
          <h3 className="font-semibold text-lg mb-2">전체 의견 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            모든 의견을 검색하고 관리합니다
          </p>
          <Badge variant="secondary">{allOpinions.length}개 의견</Badge>
        </Card>
      </div>
    </div>
  );
}
