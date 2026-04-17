import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import AllAgendasManagement from "@/components/admin/AllAgendasManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import NewAgendaForm from "@/components/admin/NewAgendaForm";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Agenda, Category } from "@shared/schema";

export default function AdminAgendasPage() {
  const [, setLocation] = useLocation();
  const [matchAll] = useRoute("/admin/agendas/all");
  const [matchCategories] = useRoute("/admin/agendas/categories");
  const [matchNew] = useRoute("/admin/agendas/new");

  const { data: agendas = [] } = useQuery<Agenda[]>({
    queryKey: ["/api/agendas"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const activeAgendas = agendas.filter(
    (a) => a.endDate && new Date(a.endDate) > new Date()
  ).length;

  const completedAgendas = agendas.filter(
    (a) => a.endDate && new Date(a.endDate) <= new Date()
  ).length;

  if (matchAll) {
    return <AllAgendasManagement />;
  }

  if (matchCategories) {
    return <CategoryManagement />;
  }

  if (matchNew) {
    return <NewAgendaForm />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">안건 관리</h1>
          <p className="text-muted-foreground">
            안건 생성, 수정, 카테고리 관리를 합니다
          </p>
        </div>
        <Button
          onClick={() => setLocation("/admin/agendas/new")}
          data-testid="button-create-agenda"
        >
          <FileText className="w-4 h-4 mr-2" />
          새 안건 생성
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation("/admin/agendas/all")}
          data-testid="card-all-agendas"
        >
          <h3 className="font-semibold text-lg mb-2">전체 안건 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            모든 안건을 조회하고 수정, 삭제할 수 있습니다
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">진행 중: {activeAgendas}</Badge>
            <Badge variant="outline">완료: {completedAgendas}</Badge>
          </div>
        </Card>

        <Card
          className="p-6 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation("/admin/agendas/categories")}
          data-testid="card-categories"
        >
          <h3 className="font-semibold text-lg mb-2">카테고리 관리</h3>
          <p className="text-sm text-muted-foreground mb-4">
            안건 카테고리를 확인합니다
          </p>
          <Badge variant="secondary">{categories.length}개 카테고리</Badge>
        </Card>
      </div>
    </div>
  );
}
