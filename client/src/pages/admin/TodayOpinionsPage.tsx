import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, ThumbsUp, Mic, ArrowLeft, Loader2 } from "lucide-react";
import type { Opinion } from "@shared/schema";
import { format, isToday, isValid } from "date-fns";
import { useLocation } from "wouter";
import { getUserDisplayName } from "@/utils/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type OpinionWithUser = Opinion & {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export default function TodayOpinionsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteOpinionId, setDeleteOpinionId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: allOpinions = [], isLoading, isError } = useQuery<OpinionWithUser[]>({
    queryKey: ["/api/opinions"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/opinions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      toast({
        title: "의견 삭제 완료",
        description: "의견이 성공적으로 삭제되었습니다.",
      });
      setDeleteOpinionId(null);
    },
    onError: () => {
      toast({
        title: "의견 삭제 실패",
        description: "의견 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const todayOpinions = allOpinions.filter((opinion) => {
    if (!opinion.createdAt) return false;
    const date = new Date(opinion.createdAt);
    return isValid(date) && isToday(date);
  });

  const filteredOpinions = todayOpinions.filter((opinion) => {
    const matchesSearch = opinion.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || opinion.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">오늘의 주민 의견</h2>
        <p className="text-muted-foreground">
          오늘 접수된 {todayOpinions.length}건의 의견을 확인하세요
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="의견 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger data-testid="select-type-filter">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="text">텍스트</SelectItem>
              <SelectItem value="voice">음성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작성자</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>좋아요</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full max-w-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : isError ? (
        <Card className="p-12">
          <p className="text-center text-destructive">데이터를 불러오는 중 오류가 발생했습니다</p>
        </Card>
      ) : filteredOpinions.length === 0 ? (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">
            {todayOpinions.length === 0 
              ? "오늘 접수된 의견이 없습니다" 
              : "검색 결과가 없습니다"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작성자</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>좋아요</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpinions.map((opinion) => (
                <TableRow key={opinion.id} data-testid={`opinion-row-${opinion.id}`}>
                  <TableCell>
                    <p className="font-medium text-sm">
                      {getUserDisplayName(opinion.displayName, opinion.username)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-md line-clamp-2">{opinion.content}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={opinion.type === "voice" ? "secondary" : "outline"}>
                      {opinion.type === "voice" ? (
                        <>
                          <Mic className="w-3 h-3 mr-1" />
                          음성
                        </>
                      ) : (
                        "텍스트"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-sm">{opinion.likes}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(opinion.createdAt), "HH:mm")}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/opinion/${opinion.id}`)}
                        data-testid={`button-view-${opinion.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog open={deleteOpinionId === opinion.id} onOpenChange={(open) => !open && setDeleteOpinionId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteOpinionId(opinion.id)}
                            data-testid={`button-delete-${opinion.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>의견을 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 작업은 되돌릴 수 없습니다. 의견이 영구적으로 삭제됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(opinion.id)}>
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
