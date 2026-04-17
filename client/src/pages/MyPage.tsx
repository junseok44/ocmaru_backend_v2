import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Heart,
  FileText,
  Bookmark,
  User,
  LogOut,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayName } from "@/utils/user";

interface UserStats {
  myOpinionsCount: number;
  likedOpinionsCount: number;
  myAgendasCount: number;
  bookmarkedAgendasCount: number;
}

export default function MyPage() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const { toast } = useToast();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<UserStats>({
    queryKey: ["/api/users/me/stats"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string }) => {
      if (!user || !user.id) {
        throw new Error("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      }

      console.log("[MyPage] Updating profile:", {
        userId: user.id,
        displayName: data.displayName,
      });

      try {
        const response = await apiRequest("PATCH", "/api/users/me", data);
        const result = await response.json();
        console.log("[MyPage] Profile update response:", result);
        return result;
      } catch (error: any) {
        console.error("[MyPage] Profile update error:", error);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      console.log("[MyPage] Profile update success:", updatedUser);
      // 쿼리 데이터 직접 업데이트 (React Query가 자동으로 리렌더링함)
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      setIsEditDialogOpen(false);
      setDisplayName("");
      toast({
        title: "프로필이 업데이트되었습니다",
        description: "닉네임이 성공적으로 변경되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("[MyPage] Profile update error:", error);
      const errorMessage = error?.message || "프로필 업데이트 중 오류가 발생했습니다.";
      toast({
        variant: "destructive",
        title: "업데이트 실패",
        description: errorMessage,
      });
    },
  });

  const handleEditClick = () => {
    if (user) {
      setDisplayName(getUserDisplayName(user.displayName, user.username) || "");
      setIsEditDialogOpen(true);
    }
  };

  const handleSave = () => {
    if (displayName.trim()) {
      updateProfileMutation.mutate({ displayName: displayName.trim() });
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user.id) {
        throw new Error("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      }

      console.log("[MyPage] Deleting account:", {
        userId: user.id,
      });

      try {
        const response = await apiRequest("DELETE", "/api/users/me");
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "회원 탈퇴 중 오류가 발생했습니다.");
        }
        return await response.json();
      } catch (error: any) {
        console.error("[MyPage] Account deletion error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("[MyPage] Account deletion success");
      toast({
        title: "회원 탈퇴가 완료되었습니다",
        description: "이용해주셔서 감사합니다.",
      });
      logout();
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("[MyPage] Account deletion error:", error);
      const errorMessage = error?.message || "회원 탈퇴 중 오류가 발생했습니다.";
      toast({
        variant: "destructive",
        title: "탈퇴 실패",
        description: errorMessage,
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-20">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-muted-foreground mb-6">
              마이페이지를 이용하려면 로그인해주세요.
            </p>
            <Button onClick={() => setLocation("/")}>홈으로 이동</Button>
          </Card>
        </div>
      </div>
    );
  }

  const userProfile = {
    name: getUserDisplayName(user.displayName, user.username),
    email: user.email || "",
    avatar: user.avatarUrl || "",
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">마이페이지</h2>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-edit-profile"
            onClick={handleEditClick}
          >
            <User className="w-4 h-4 mr-2" />
            프로필 수정
          </Button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20" data-testid="avatar-profile">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold" data-testid="text-username">
                {userProfile.name}
              </h3>
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-email"
              >
                {userProfile.email}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">활동 내역</h3>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              data-testid="card-my-opinions"
              onClick={() => setLocation("/my/opinions")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">내가 쓴 주민 의견</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p
                      className="text-2xl font-bold mt-1"
                      data-testid="count-my-opinions"
                    >
                      {stats?.myOpinionsCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              data-testid="card-liked-opinions"
              onClick={() => setLocation("/my/liked")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">좋아요한 의견</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p
                      className="text-2xl font-bold mt-1"
                      data-testid="count-liked-opinions"
                    >
                      {stats?.likedOpinionsCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              data-testid="card-my-agendas"
              onClick={() => setLocation("/my/agendas")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">내 의견이 포함된 안건</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p
                      className="text-2xl font-bold mt-1"
                      data-testid="count-my-agendas"
                    >
                      {stats?.myAgendasCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card
              className="p-6 hover-elevate active-elevate-2 cursor-pointer"
              data-testid="card-bookmarked-agendas"
              onClick={() => setLocation("/my/bookmarks")}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">즐겨찾기한 안건</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mt-1" />
                  ) : statsError ? (
                    <p className="text-sm text-destructive mt-1">오류</p>
                  ) : (
                    <p
                      className="text-2xl font-bold mt-1"
                      data-testid="count-bookmarked-agendas"
                    >
                      {stats?.bookmarkedAgendasCount || 0}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">계정 설정</h3>

          <Card
            className="p-4 hover-elevate active-elevate-2 cursor-pointer"
            data-testid="card-logout"
            onClick={() => {
              logout();
              setLocation("/");
            }}
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">로그아웃</span>
            </div>
          </Card>

          <Card
            className="p-4 hover-elevate active-elevate-2 cursor-pointer"
            data-testid="card-delete-account"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">회원 탈퇴</span>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
            <DialogDescription>
              표시될 닉네임을 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">닉네임</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={50}
                data-testid="input-display-name"
              />
              <p className="text-sm text-muted-foreground">
                최대 50자까지 입력 가능합니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!displayName.trim() || updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-account">
          <DialogHeader>
            <DialogTitle>회원 탈퇴</DialogTitle>
            <DialogDescription>
              정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              회원 탈퇴 시 다음 정보가 모두 삭제됩니다:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>프로필 정보</li>
              <li>작성한 의견 및 댓글</li>
              <li>좋아요 및 즐겨찾기</li>
              <li>기타 모든 활동 내역</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteAccountMutation.isPending ? "처리 중..." : "회원 탈퇴"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
