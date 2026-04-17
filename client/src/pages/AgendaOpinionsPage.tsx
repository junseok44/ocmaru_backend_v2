import Header from "@/components/Header";
import AgendaHeader from "@/components/AgendaHeader";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import type { Agenda, Category, Opinion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { trackAgendaComment, trackBookmark } from "@/lib/analytics";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  isBookmarked?: boolean;
}

interface BookmarkStatus {
  isBookmarked: boolean;
  bookmarkCount: number;
}

export default function AgendaOpinionsPage() {
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const [match, params] = useRoute("/agendas/:id/opinions");
  const agendaId = params?.id;
  const { toast } = useToast();

  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { user } = useUser();

  // 페이지 진입 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [agendaId]);

  const {
    data: agenda,
    isLoading: agendaLoading,
    error: agendaError,
  } = useQuery<AgendaWithCategory>({
    queryKey: [`/api/agendas/${agendaId}`],
    enabled: !!agendaId,
  });

  const bookmarkStatusQueryKey = `/api/agendas/${agendaId}/bookmark-status`;
  const { data: bookmarkStatus } = useQuery<BookmarkStatus>({
    queryKey: [bookmarkStatusQueryKey],
    enabled: !!agendaId,
    queryFn: async () => {
      const res = await authFetch(bookmarkStatusQueryKey, {
        cache: "no-store",
        headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch bookmark status");
      }
      return (await res.json()) as BookmarkStatus;
    },
  });

  const { data: relatedOpinions = [], isLoading: opinionsLoading } = useQuery<
    Opinion[]
  >({
    queryKey: [`/api/agendas/${agendaId}/opinions`],
    enabled: !!agendaId,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/agendas/${agendaId}/bookmark`);
      } else {
        await apiRequest("POST", `/api/agendas/${agendaId}/bookmark`);
      }
    },
    onMutate: async (isBookmarked: boolean) => {
      // Optimistic update: 즉시 UI 업데이트
      await queryClient.cancelQueries({ queryKey: [bookmarkStatusQueryKey] });

      const previousStatus = queryClient.getQueryData<BookmarkStatus>([
        bookmarkStatusQueryKey,
      ]);

      if (previousStatus) {
        const prevCount = previousStatus.bookmarkCount ?? 0;
        queryClient.setQueryData<BookmarkStatus>(
          [bookmarkStatusQueryKey],
          {
            ...previousStatus,
            isBookmarked: !isBookmarked,
            bookmarkCount: isBookmarked
              ? Math.max(0, prevCount - 1)
              : prevCount + 1,
          }
        );
      }

      return { previousStatus };
    },
    onError: (err, isBookmarked, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousStatus) {
        queryClient.setQueryData(
          [bookmarkStatusQueryKey],
          context.previousStatus
        );
      }
      toast({
        title: "북마크 실패",
        description: "북마크 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: (_, isBookmarked) => {
      // GA 이벤트 추적: 즐겨찾기
      if (agendaId) {
        trackBookmark(agendaId, isBookmarked ? "unbookmark" : "bookmark");
      }

      // 성공 시 쿼리 무효화하여 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: [bookmarkStatusQueryKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  const handleBookmarkClick = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "북마크 기능을 사용하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate(bookmarkStatus?.isBookmarked ?? false);
  };

  const opinionMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      const res = await apiRequest(
        "POST",
        `/api/agendas/${agendaId}/opinions`,
        {
          content,
          type: "text",
        },
      );
      return res.json();
    },
    onSuccess: () => {
      // GA 이벤트 추적: 안건 댓글 (의견 작성)
      if (agendaId) {
        trackAgendaComment(agendaId);
      }

      setComment("");
      toast({
        title: "의견이 제출되었습니다",
        description: "의견이 안건에 자동으로 연결되었습니다.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}/opinions`],
      });
    },
    onError: (error: any) => {
      console.error("Opinion submission error:", error);
      toast({
        title: "의견 제출 실패",
        description: error?.message || "의견을 제출하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "의견을 등록하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        title: "의견을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    if (!agendaId) {
      toast({
        title: "오류",
        description: "안건 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    opinionMutation.mutate(comment.trim());
  };

  const handleCommentFocus = () => {
    if (!user) {
      setShowLoginDialog(true);
    }
  };
  //여기부터 return
  if (!match || !agendaId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">안건을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (agendaError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center">
            안건을 불러오는 데 실패했습니다.
          </div>
        </div>
      </div>
    );
  }

  if (agendaLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">안건을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-32 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="relative w-full h-[500px] group">
              <img
                src={
                  typeof agenda.imageUrl === "string" &&
                  agenda.imageUrl.trim().length > 0
                    ? agenda.imageUrl
                    : "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop"
                }
                alt="안건 대표 이미지"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Crect width='1200' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3E안건 이미지%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-black/90 pointer-events-none" />

              {/* 🚀 [추가] 뒤로가기 버튼 (이미지 좌측 상단) */}
              <div className="absolute top-6 left-4 md:left-8 z-20">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 hover:text-white pl-2 pr-4 h-10 rounded-full bg-black/20 backdrop-blur-sm"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  뒤로가기
                </Button>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-10 flex flex-col items-start justify-end">
                <div className="w-full text-white [&_*]:text-white [&_.text-muted-foreground]:text-white/80 [&_.bg-background]:bg-transparent [&_.border]:border-white/30 text-left">
                  <AgendaHeader
                    agenda={{
                      ...agenda,
                      isBookmarked:
                        bookmarkStatus?.isBookmarked ?? agenda?.isBookmarked,
                    }}
                    user={user ? { isAdmin: user.isAdmin } : undefined}
                    onBookmarkClick={handleBookmarkClick}
                    bookmarkLoading={bookmarkMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">주민의견</h2>

              {opinionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : relatedOpinions.length > 0 ? (
                <div className="space-y-4">
                  {relatedOpinions.map((opinion) => (
                    <OpinionCard
                      key={String(opinion.id)}
                      id={String(opinion.id)}
                      authorName="익명"
                      content={opinion.content}
                      likeCount={opinion.likes ?? 0}
                      commentCount={0}
                      timestamp={
                        opinion.createdAt
                          ? new Date(opinion.createdAt).toLocaleDateString("ko-KR")
                          : ""
                      }
                      onClick={() => setLocation(`/opinion/${opinion.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">관련 의견이 없습니다.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-card border-t border-card-border p-4 z-30">
        <div className="max-w-5xl mx-auto flex gap-3">
          <Textarea
            placeholder="이 안건에 대한 의견을 입력하세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={handleCommentFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleCommentSubmit();
              }
            }}
            className="min-h-12 resize-none"
            data-testid="input-agenda-comment"
          />
          <Button
            onClick={handleCommentSubmit}
            disabled={!comment.trim() || opinionMutation.isPending}
            className="self-end"
            data-testid="button-submit-agenda-comment"
          >
            {opinionMutation.isPending ? "제출 중..." : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}

