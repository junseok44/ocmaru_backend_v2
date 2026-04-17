import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Loader2, Shield } from "lucide-react";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getUserDisplayName } from "@/utils/user";

type UserWithoutPassword = Omit<User, "password">;

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = allUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower)
    );
  });

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "google":
        return "구글";
      case "kakao":
        return "카카오";
      case "local":
        return "로컬";
      default:
        return provider;
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
      <div>
        <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
        <p className="text-muted-foreground">
          사용자 조회, 제재, 관리자 권한을 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6" data-testid="card-all-users">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">전체 사용자</p>
          </div>
          <p className="text-3xl font-bold">{allUsers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">가입된 사용자</p>
        </Card>

        <Card className="p-6" data-testid="card-oauth-users">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">OAuth 사용자</p>
          </div>
          <p className="text-3xl font-bold">
            {allUsers.filter((u) => u.provider !== "local").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            구글/카카오 로그인
          </p>
        </Card>

        <Card className="p-6" data-testid="card-local-users">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">로컬 사용자</p>
          </div>
          <p className="text-3xl font-bold">
            {allUsers.filter((u) => u.provider === "local").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            이메일 가입
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="사용자 이름, 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 사용자가 없습니다"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>가입 방법</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(getUserDisplayName(user.displayName, user.username) || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {getUserDisplayName(user.displayName, user.username)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getProviderLabel(user.provider)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.createdAt), "yyyy.MM.dd", { locale: ko })}
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
