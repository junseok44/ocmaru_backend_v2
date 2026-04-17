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
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, ThumbsUp, Mic } from "lucide-react";
import type { Opinion } from "@shared/schema";
import { format } from "date-fns";
import { getUserDisplayName } from "@/utils/user";

type OpinionWithUser = Opinion & {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export default function AllOpinionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: opinions = [], isLoading } = useQuery<OpinionWithUser[]>({
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
    },
  });

  const filteredOpinions = opinions.filter((opinion) => {
    const matchesSearch = opinion.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || opinion.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">전체 의견 관리</h2>
        <p className="text-muted-foreground">
          모든 의견을 검색하고 관리합니다
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
        <Card className="p-12">
          <p className="text-center text-muted-foreground">로딩 중...</p>
        </Card>
      ) : filteredOpinions.length === 0 ? (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">의견이 없습니다</p>
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
                    <div className="max-w-md">
                      <p className="line-clamp-2">{opinion.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {opinion.type === "voice" ? (
                      <Badge variant="outline" className="gap-1">
                        <Mic className="w-3 h-3" />
                        음성
                      </Badge>
                    ) : (
                      <Badge variant="secondary">텍스트</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{opinion.likes}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(opinion.createdAt), "yyyy-MM-dd")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/opinion/${opinion.id}`, "_blank")}
                        data-testid={`button-view-${opinion.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(opinion.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${opinion.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {filteredOpinions.length}개의 의견
        </p>
      </div>
    </div>
  );
}
