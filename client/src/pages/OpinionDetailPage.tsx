import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MoreVertical, ArrowLeft, CheckCircle, ArrowRight, Pencil, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import CommentThread from "@/components/CommentThread";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { trackOpinionLike, trackCommentCreated } from "@/lib/analytics";
import LoginDialog from "@/components/LoginDialog"; // 👈 LoginDialog import
import { getUserDisplayName } from "@/utils/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface OpinionDetail {
  id: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  linkedAgenda: {
    id: string;
    title: string;
    category: string;
    status: string;
    clusterId: string;
    clusterName: string;
  } | null;
}

interface CommentWithUser {
  id: string;
  opinionId: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function OpinionDetailPage() {
  const [, params] = useRoute("/opinion/:id");
  const opinionId = params?.id;
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCommentEditDialogOpen, setIsCommentEditDialogOpen] = useState(false);
  const [isCommentDeleteDialogOpen, setIsCommentDeleteDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentWithUser | null>(null);
  const [commentEditContent, setCommentEditContent] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [reportingComment, setReportingComment] = useState<CommentWithUser | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  // 1️⃣ 로그인 팝업 상태 관리
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const { data: opinion, isLoading: opinionLoading } = useQuery<OpinionDetail>({
    queryKey: [`/api/opinions/${opinionId}`],
    enabled: !!opinionId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: [`/api/opinions/${opinionId}/comments`],
    enabled: !!opinionId,
  });

  const { data: opinionLike, isLoading: likeStatusLoading } = useQuery<{ liked: boolean }>({
    queryKey: [`/api/opinions/${opinionId}/like?userId=${user?.id}`],
    enabled: !!opinionId && !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      if (opinionLike?.liked) {
        return apiRequest("DELETE", `/api/opinions/${opinionId}/like`, { userId: user.id });
      } else {
        return apiRequest("POST", `/api/opinions/${opinionId}/like`, { userId: user.id });
      }
    },
    onMutate: async () => {
      // GA 이벤트 추적: 좋아요
      if (opinionId) {
        trackOpinionLike(opinionId, opinionLike?.liked ? "unlike" : "like");
      }
      
      await queryClient.cancelQueries({ queryKey: [`/api/opinions/${opinionId}`] });
      await queryClient.cancelQueries({ queryKey: [`/api/opinions/${opinionId}/like?userId=${user?.id}`] });
      
      const previousOpinion = queryClient.getQueryData<OpinionDetail>([`/api/opinions/${opinionId}`]);
      const previousLike = queryClient.getQueryData<{ liked: boolean }>([`/api/opinions/${opinionId}/like?userId=${user?.id}`]);
      
      if (previousOpinion) {
        queryClient.setQueryData<OpinionDetail>([`/api/opinions/${opinionId}`], {
          ...previousOpinion,
          likes: opinionLike?.liked ? previousOpinion.likes - 1 : previousOpinion.likes + 1,
        });
      }
      
      queryClient.setQueryData<{ liked: boolean }>([`/api/opinions/${opinionId}/like?userId=${user?.id}`], {
        liked: !opinionLike?.liked,
      });
      
      return { previousOpinion, previousLike };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousOpinion) {
        queryClient.setQueryData([`/api/opinions/${opinionId}`], context.previousOpinion);
      }
      if (context?.previousLike) {
        queryClient.setQueryData([`/api/opinions/${opinionId}/like?userId=${user?.id}`], context.previousLike);
      }
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "좋아요 처리에 실패했습니다",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}/like?userId=${user?.id}`] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");
      return apiRequest("POST", `/api/opinions/${opinionId}/comments`, {
        userId: user.id,
        content,
      });
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
      
      const previousComments = queryClient.getQueryData<CommentWithUser[]>([`/api/opinions/${opinionId}/comments`]);
      
      const optimisticComment: CommentWithUser = {
        id: `temp-${Date.now()}`,
        opinionId: opinionId!,
        userId: user!.id,
        content,
        likes: 0,
        createdAt: new Date().toISOString(),
        username: user!.username,
        displayName: user!.displayName || null,
        avatarUrl: user!.avatarUrl || null,
      };
      
      queryClient.setQueryData<CommentWithUser[]>(
        [`/api/opinions/${opinionId}/comments`],
        [...(previousComments || []), optimisticComment]
      );
      
      return { previousComments };
    },
    onSuccess: () => {
      // GA 이벤트 추적: 답글 작성
      if (opinionId) {
        trackCommentCreated(opinionId);
      }
      
      setComment("");
      toast({
        title: "답글이 등록되었습니다",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([`/api/opinions/${opinionId}/comments`], context.previousComments);
      }
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "답글 등록에 실패했습니다",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return apiRequest("PATCH", `/api/comments/${id}`, { content });
    },
    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
      
      const previousComments = queryClient.getQueryData<CommentWithUser[]>([`/api/opinions/${opinionId}/comments`]);
      
      queryClient.setQueryData<CommentWithUser[]>(
        [`/api/opinions/${opinionId}/comments`],
        (old) => old?.map((c) => c.id === id ? { ...c, content } : c) || []
      );
      
      return { previousComments };
    },
    onSuccess: () => {
      setIsCommentEditDialogOpen(false);
      setEditingComment(null);
      toast({
        title: "답글이 수정되었습니다",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([`/api/opinions/${opinionId}/comments`], context.previousComments);
      }
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "답글 수정에 실패했습니다",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/comments/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
      
      const previousComments = queryClient.getQueryData<CommentWithUser[]>([`/api/opinions/${opinionId}/comments`]);
      
      queryClient.setQueryData<CommentWithUser[]>(
        [`/api/opinions/${opinionId}/comments`],
        (old) => old?.filter((c) => c.id !== id) || []
      );
      
      return { previousComments };
    },
    onSuccess: () => {
      setIsCommentDeleteDialogOpen(false);
      setEditingComment(null);
      toast({
        title: "답글이 삭제되었습니다",
      });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([`/api/opinions/${opinionId}/comments`], context.previousComments);
      }
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "답글 삭제에 실패했습니다",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}/comments`] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      return apiRequest("POST", "/api/reports", {
        reporterId: user.id,
        opinionId: reportingComment ? undefined : opinionId,
        commentId: reportingComment ? reportingComment.id : undefined,
        reportType,
        description: reportDescription,
      });
    },
    onSuccess: () => {
      setIsReportDialogOpen(false);
      setReportType("spam");
      setReportDescription("");
      setReportingComment(null);
      toast({
        title: "신고가 접수되었습니다",
        description: "관리자가 검토 후 조치하겠습니다.",
      });
    },
    onError: () => {
      toast({
        title: "신고 실패",
        description: "신고 접수 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 2️⃣ 좋아요 핸들러 수정
  const handleLike = () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    likeMutation.mutate();
  };

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("PATCH", `/api/opinions/${opinionId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opinions/${opinionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      setIsEditDialogOpen(false);
      toast({
        title: "의견이 수정되었습니다",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "의견 수정에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/opinions/${opinionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
      toast({
        title: "의견이 삭제되었습니다",
      });
      setLocation("/opinions");
    },
    onError: (error: any) => {
      toast({
        title: "오류가 발생했습니다",
        description: error.message || "의견 삭제에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // 3️⃣ 답글 등록 핸들러 수정
  const handleSubmitComment = () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  const handleEditComment = (comment: CommentWithUser) => {
    setEditingComment(comment);
    setCommentEditContent(comment.content);
    setIsCommentEditDialogOpen(true);
  };

  const handleDeleteComment = (comment: CommentWithUser) => {
    setEditingComment(comment);
    setIsCommentDeleteDialogOpen(true);
  };

  const handleReportComment = (comment: CommentWithUser) => {
    setReportingComment(comment);
    setIsReportDialogOpen(true);
  };

  const confirmEditComment = () => {
    if (editingComment && commentEditContent.trim()) {
      updateCommentMutation.mutate({
        id: editingComment.id,
        content: commentEditContent.trim(),
      });
    }
  };

  const confirmDeleteComment = () => {
    if (editingComment) {
      deleteCommentMutation.mutate(editingComment.id);
    }
  };

  const handleEdit = () => {
    setEditContent(opinion?.content || "");
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmEdit = () => {
    if (editContent.trim()) {
      updateMutation.mutate(editContent.trim());
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  if (opinionLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          의견을 불러오는 중...
        </div>
      </div>
    );
  }

  if (!opinion) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          의견을 찾을 수 없습니다
        </div>
      </div>
    );
  }


  const authorName = getUserDisplayName(opinion.displayName, opinion.username);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <div className="space-y-6">
          {opinion.linkedAgenda && (
            <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-linked-agenda">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 flex items-center gap-2 flex-wrap">
                    이 의견이 안건에 반영되었습니다
                    <Badge variant="secondary" className="text-xs">
                      {opinion.linkedAgenda.status}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    '{opinion.linkedAgenda.clusterName}' 클러스터를 통해 안건으로 생성되었습니다
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{opinion.linkedAgenda.category}</Badge>
                    <p className="text-sm font-medium">{opinion.linkedAgenda.title}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/agendas/${opinion.linkedAgenda!.id}`)}
                  className="flex-shrink-0"
                  data-testid="button-view-agenda"
                >
                  안건 보기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-12 h-12" data-testid="avatar-author">
                <AvatarImage src={opinion.avatarUrl || ""} />
                <AvatarFallback>{authorName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium" data-testid="text-author">
                      {authorName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-time">
                      {formatDistanceToNow(new Date(opinion.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid="button-more">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.id === opinion.userId ? (
                          <>
                            <DropdownMenuItem onClick={handleEdit} data-testid="menu-edit">
                              <Pencil className="w-4 h-4 mr-2" />
                              수정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={handleDelete} 
                              className="text-destructive focus:text-destructive"
                              data-testid="menu-delete"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => setIsReportDialogOpen(true)} 
                            data-testid="menu-report"
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            신고하기
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            <div className="pl-15">
              <p className="text-base leading-relaxed" data-testid="text-content">
                {opinion.content}
              </p>
            </div>

            <div className="flex items-center gap-4 pl-15">
              <button
                className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLike}
                disabled={likeMutation.isPending || likeStatusLoading} // !user 제거 (클릭 가능해야 팝업이 뜸)
                data-testid="button-like"
              >
                <Heart
                  className={`w-5 h-5 ${opinionLike?.liked ? "fill-current text-primary" : ""}`}
                />
                <span className="font-medium">{opinion.likes}</span>
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">
              답글 {comments.length}개
            </h3>
            {commentsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                답글을 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                아직 답글이 없습니다. 첫 번째로 답글을 달아보세요!
              </div>
            ) : (
              <CommentThread 
                comments={comments}
                currentUserId={user?.id}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReport={handleReportComment}
              />
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">답글 작성</h3>
            <div className="space-y-3">
              <Textarea
                placeholder="답글을 입력하세요..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-24"
                data-testid="input-comment"
                disabled={commentMutation.isPending}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || commentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  {commentMutation.isPending ? "등록 중..." : "답글 달기"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit">
          <DialogHeader>
            <DialogTitle>의견 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="의견 내용을 입력하세요..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-48"
              data-testid="input-edit-content"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                취소
              </Button>
              <Button
                onClick={confirmEdit}
                disabled={!editContent.trim() || updateMutation.isPending}
                data-testid="button-confirm-edit"
              >
                {updateMutation.isPending ? "수정 중..." : "수정하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>의견 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 의견을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCommentEditDialogOpen} onOpenChange={setIsCommentEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-comment">
          <DialogHeader>
            <DialogTitle>답글 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="답글 내용을 입력하세요..."
              value={commentEditContent}
              onChange={(e) => setCommentEditContent(e.target.value)}
              className="min-h-32"
              data-testid="input-edit-comment-content"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCommentEditDialogOpen(false)}
                data-testid="button-cancel-edit-comment"
              >
                취소
              </Button>
              <Button
                onClick={confirmEditComment}
                disabled={!commentEditContent.trim() || updateCommentMutation.isPending}
                data-testid="button-confirm-edit-comment"
              >
                {updateCommentMutation.isPending ? "수정 중..." : "수정하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCommentDeleteDialogOpen} onOpenChange={setIsCommentDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-comment">
          <AlertDialogHeader>
            <AlertDialogTitle>답글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 답글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-comment">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-comment"
            >
              {deleteCommentMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent data-testid="dialog-report">
          <DialogHeader>
            <DialogTitle>{reportingComment ? "답글" : "의견"} 신고</DialogTitle>
            <DialogDescription>
              부적절한 내용을 신고해주세요. 관리자가 검토 후 조치하겠습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">신고 사유</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">스팸</SelectItem>
                  <SelectItem value="inappropriate">부적절한 내용</SelectItem>
                  <SelectItem value="offensive">욕설/비방</SelectItem>
                  <SelectItem value="misleading">허위 정보</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-description">상세 설명</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="신고 사유를 자세히 설명해주세요"
                rows={4}
                data-testid="textarea-report-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              data-testid="button-cancel-report"
            >
              취소
            </Button>
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reportDescription.trim() || reportMutation.isPending}
              data-testid="button-submit-report"
            >
              신고하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4️⃣ 로그인 다이얼로그 추가 */}
      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen} 
      />

    </div>
  );
}