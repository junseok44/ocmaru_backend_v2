import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, Eye, EyeOff, Check, X, MessageSquare, Loader2 } from "lucide-react";

export default function ReportManagement() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"hide" | "approve" | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/reports/${id}`, { status, resolvedAt: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "신고 처리 완료",
        description: "신고가 성공적으로 처리되었습니다.",
      });
      setActionDialog(false);
      setSelectedReport(null);
      setActionType(null);
    },
    onError: () => {
      toast({
        title: "처리 실패",
        description: "신고 처리에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const hideContentMutation = useMutation({
    mutationFn: async (report: Report) => {
      if (report.commentId) {
        await apiRequest("DELETE", `/api/comments/${report.commentId}`);
      } else if (report.opinionId) {
        await apiRequest("DELETE", `/api/opinions/${report.opinionId}`);
      } else if (report.agendaId) {
        await apiRequest("PATCH", `/api/agendas/${report.agendaId}`, {
          status: "closed",
        });
      }
      return apiRequest("PATCH", `/api/reports/${report.id}`, {
        status: "resolved",
        resolvedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      toast({
        title: "콘텐츠 삭제 완료",
        description: "신고된 콘텐츠가 삭제되었습니다.",
      });
      setActionDialog(false);
      setSelectedReport(null);
      setActionType(null);
    },
    onError: () => {
      toast({
        title: "처리 실패",
        description: "콘텐츠 삭제 처리에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && report.status === "pending") ||
      (statusFilter === "completed" &&
        (report.status === "resolved" || report.status === "dismissed"));
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "opinion" && report.opinionId) ||
      (typeFilter === "agenda" && report.agendaId) ||
      (typeFilter === "comment" && report.commentId);
    return matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "destructive";
      case "reviewing":
        return "default";
      case "resolved":
      case "dismissed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "대기 중";
      case "reviewing":
        return "검토 중";
      case "resolved":
        return "처리 완료";
      case "dismissed":
        return "기각";
      default:
        return status;
    }
  };

  const getTypeLabel = (report: Report) => {
    if (report.commentId) return "답글";
    if (report.opinionId) return "의견";
    return "안건";
  };

  const handleAction = (report: Report, type: "hide" | "approve") => {
    setSelectedReport(report);
    setActionType(type);
    if (type === "approve") {
      updateReportMutation.mutate({ id: report.id, status: "dismissed" });
    } else {
      setActionDialog(true);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedReport) return;
    
    if (actionType === "hide") {
      hideContentMutation.mutate(selectedReport);
    }
  };

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
        <div>
          <h2 className="text-2xl font-bold mb-2">신고 관리</h2>
          <p className="text-muted-foreground">
            신고된 의견, 답글, 안건을 검토하고 조치합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기 중</SelectItem>
              <SelectItem value="completed">처리 완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40" data-testid="select-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="opinion">의견</SelectItem>
              <SelectItem value="comment">답글</SelectItem>
              <SelectItem value="agenda">안건</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">신고 내역이 없습니다</p>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className={`p-6 ${
                report.status === "pending" ? "border-l-4 border-l-destructive" : ""
              }`}
              data-testid={`report-${report.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <h3 className="font-semibold">
                        {getTypeLabel(report)} 신고
                      </h3>
                      <Badge variant={getStatusColor(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {report.reportType}
                        </Badge>
                      </div>
                      <p className="text-sm">{report.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(report, "hide")}
                        data-testid={`button-hide-${report.id}`}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        숨김
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(report, "approve")}
                        disabled={updateReportMutation.isPending}
                        data-testid={`button-approve-${report.id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        정상
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent data-testid="dialog-action">
          <DialogHeader>
            <DialogTitle>신고된 콘텐츠 숨김 처리</DialogTitle>
            <DialogDescription>
              이 콘텐츠를 숨김 처리하시겠습니까? 숨김 처리된 콘텐츠는 일반 사용자에게
              표시되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(false);
                setSelectedReport(null);
                setActionType(null);
              }}
              data-testid="button-cancel-action"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
              disabled={hideContentMutation.isPending}
              data-testid="button-confirm-action"
            >
              {hideContentMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              숨김 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
