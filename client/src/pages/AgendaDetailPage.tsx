import Header from "@/components/Header";
import AgendaHeader from "@/components/AgendaHeader";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Trash2, Upload, ChevronRight, Check, ArrowLeft, PenTool } from "lucide-react";
import VotingWidget from "@/components/VotingWidget";
import Timeline from "@/components/Timeline";
import OpinionCard from "@/components/OpinionCard";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import LoginDialog from "@/components/LoginDialog";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import type { Agenda, Category, Opinion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { getStatusLabel } from "@/lib/utils";
import { trackVote, trackBookmark } from "@/lib/analytics";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  isBookmarked?: boolean;
}

interface BookmarkStatus {
  isBookmarked: boolean;
  bookmarkCount: number;
}

interface VoteStats {
  total: number;
  agree: number;
  disagree: number;
  neutral: number;
}

interface Vote {
  id: string;
  userId: string;
  agendaId: string;
  voteType: "agree" | "disagree" | "neutral";
}

interface ExecutionTimelineItem {
  id: string;
  agendaId: string;
  userId: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function AgendaDetailPage() {
  const [location, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const [match, params] = useRoute("/agendas/:id");
  const agendaId = params?.id;
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [executionTimelineDialogOpen, setExecutionTimelineDialogOpen] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [showBasicInfoEdit, setShowBasicInfoEdit] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedStatus, setEditedStatus] = useState<
    "created" | "voting" | "proposing" | "answered" | "executing" | "executed"
  >("created");
  const [editedResponse, setEditedResponse] = useState<{
    authorName: string;
    responseDate: string;
    content: string;
  }>({
    authorName: "",
    responseDate: new Date().toISOString().slice(0, 10),
    content: "",
  });
  const [editedOkinewsUrl, setEditedOkinewsUrl] = useState("");
  const [editedReferenceLinks, setEditedReferenceLinks] = useState<string[]>(
    [],
  );
  const [editedReferenceFiles, setEditedReferenceFiles] = useState<string[]>(
    [],
  );
  const [editedRegionalCases, setEditedRegionalCases] = useState<string[]>([]);
  const [newReferenceLink, setNewReferenceLink] = useState("");
  const [newRegionalCase, setNewRegionalCase] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timelineItems, setTimelineItems] = useState<
    Array<{
      id: string;
      authorName: string;
      content: string;
      image: File | null;
      date: string;
      imagePreview?: string;
      existingImageUrl?: string;
    }>
  >([]);
  const timelineImageInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 관리자 쿼리파라미터(edit=1)로 인한 자동 모달 오픈이 한 번만 일어나도록 제어
  const hasAutoOpenedFromQueryRef = useRef(false);

  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { user } = useUser();

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

  const { data: voteStats } = useQuery<VoteStats>({
    queryKey: [`/api/agendas/${agendaId}/votes`],
    enabled: !!agendaId,
  });

  const { data: userVote } = useQuery<Vote | null>({
    queryKey: [`/api/agendas/votes/user/${user?.id}/agenda/${agendaId}`],
    enabled: !!agendaId && !!user,
  });

  const { data: relatedOpinions = [], isLoading: opinionsLoading } = useQuery<
    Opinion[]
  >({
    queryKey: [`/api/agendas/${agendaId}/opinions`],
    enabled: !!agendaId,
  });

  const { data: executionTimelineItems = [], isLoading: executionTimelineLoading } = useQuery<
    ExecutionTimelineItem[]
  >({
    queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
    enabled: !!agendaId && (agenda?.status === "executing" || agenda?.status === "executed"),
  });

  // 관리자 페이지에서 "/agendas/:id?edit=1" 형태로 들어온 경우 자동으로 편집 모달 열기
  useEffect(() => {
    if (!agenda || !user?.isAdmin || hasAutoOpenedFromQueryRef.current) return;
    try {
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      if (params.get("edit") === "1" && !editDialogOpen) {
        hasAutoOpenedFromQueryRef.current = true;
        handleEditClick();
      }
    } catch {
      // URL 파싱 실패 시 무시
    }
  }, [agenda, user, editDialogOpen]);

  const voteMutation = useMutation({
    mutationFn: async (voteType: "agree" | "disagree" | "neutral") => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("POST", "/api/votes", {
        userId: user.id,
        agendaId,
        voteType,
      });
      return res.json();
    },
    onMutate: async (voteType) => {
      if (agendaId) trackVote(agendaId, voteType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/votes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/votes/user/${user?.id}/agenda/${agendaId}`] });
    },
  });

  const deleteVoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      await apiRequest("DELETE", `/api/votes/user/${user.id}/agenda/${agendaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/votes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/votes/user/${user?.id}/agenda/${agendaId}`] });
    },
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
      if (agendaId) trackBookmark(agendaId, isBookmarked ? "unbookmark" : "bookmark");
      await queryClient.cancelQueries({ queryKey: [bookmarkStatusQueryKey] });
      const previousStatus = queryClient.getQueryData<BookmarkStatus>([
        bookmarkStatusQueryKey,
      ]);
      if (previousStatus) {
        const prevCount = previousStatus.bookmarkCount ?? 0;
        queryClient.setQueryData<BookmarkStatus>([bookmarkStatusQueryKey], {
          ...previousStatus,
          isBookmarked: !isBookmarked,
          bookmarkCount: isBookmarked ? Math.max(0, prevCount - 1) : prevCount + 1,
        });
      }
      return { previousStatus };
    },
    onError: (err, isBookmarked, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          [bookmarkStatusQueryKey],
          context.previousStatus
        );
      }
      toast({
        title: "북마크 실패",
        description: "오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bookmarkStatusQueryKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  const handleBookmarkClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    bookmarkMutation.mutate(bookmarkStatus?.isBookmarked ?? false);
  };

  const opinionMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("POST", `/api/agendas/${agendaId}/opinions`, {
        content,
        type: "text",
      });
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      toast({ title: "의견이 제출되었습니다" });
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/opinions`] });
    },
    onError: () => {
      toast({ title: "의견 제출 실패", variant: "destructive" });
    },
  });

  const updateAgendaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/agendas/${agendaId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      toast({ title: "안건이 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "수정 실패", variant: "destructive" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch(`/api/agendas/${agendaId}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("File upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.agenda) {
        setEditedReferenceFiles(data.agenda.referenceFiles || []);
        queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
        toast({ title: "파일 업로드 완료" });
      }
    },
    onError: () => {
      toast({ title: "업로드 실패", variant: "destructive" });
    },
  });

  const saveTimelineItemsMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const results = await Promise.all(
        items.map(async (item) => {
          const isExisting = item.id && !item.id.startsWith("temp-");
          const payload = {
            authorName: item.authorName,
            content: item.content,
            imageUrl:
              item.existingImageUrl ||
              (typeof item.imagePreview === "string" &&
              item.imagePreview.startsWith("http")
                ? item.imagePreview
                : "no-image"),
          };

          if (isExisting) {
            await apiRequest(
              "PATCH",
              `/api/agendas/${agendaId}/execution-timeline/${item.id}`,
              payload
            );
            return null;
          } else {
            await apiRequest(
              "POST",
              `/api/agendas/${agendaId}/execution-timeline`,
              payload
            );
            return null;
          }
        })
      );
      return results;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/execution-timeline`] });
      toast({ title: "저장 완료" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const deleteTimelineItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Spring 백엔드에서는 현재 실행 과정 삭제 API를 제공하지 않는다.
      throw new Error("실행 과정 삭제 API가 아직 지원되지 않습니다.");
    },
    onSuccess: (_, itemId) => {
      setTimelineItems(timelineItems.filter((item) => item.id !== itemId));
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}/execution-timeline`] });
      toast({ title: "삭제 완료" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const handleVote = (voteType: "agree" | "disagree" | "neutral" | null) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    if (voteType === null) deleteVoteMutation.mutate();
    else voteMutation.mutate(voteType);
  };

  const handleEditClick = () => {
    if (agenda) {
      setEditedTitle(agenda.title);
      setEditedDescription(agenda.description);
      setEditedStatus(agenda.status);

      const responseObj = typeof agenda.response === 'object' && agenda.response
        ? agenda.response as any
        : { content: typeof agenda.response === 'string' ? agenda.response : "" };

      setEditedResponse({
        authorName: responseObj.authorName || "",
        responseDate: responseObj.responseDate || new Date().toISOString().slice(0, 10),
        content: responseObj.content || "",
      });

      setEditedOkinewsUrl(agenda.okinewsUrl || "");
      setEditedReferenceLinks(agenda.referenceLinks || []);
      setEditedReferenceFiles(agenda.referenceFiles || []);
      setEditedRegionalCases(agenda.regionalCases || []);
      setShowResponseInput(false);
      setShowBasicInfoEdit(false);

      if ((agenda.status === "executing" || agenda.status === "executed") && executionTimelineItems.length > 0) {
        setTimelineItems(
          executionTimelineItems.map((item) => ({
            id: item.id,
            authorName: item.authorName,
            content: item.content,
            image: null,
            date: new Date(item.createdAt).toISOString().slice(0, 10),
            imagePreview: item.imageUrl || undefined,
            existingImageUrl: item.imageUrl || undefined,
          }))
        );
      } else {
        setTimelineItems([]);
      }
      setEditDialogOpen(true);
    }
  };

  const handleSaveBasicInfo = async () => {
    // 기본 정보만 저장 (제목, 설명, 참고자료)
    await updateAgendaMutation.mutateAsync({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus, // 상태는 유지
      response: editedResponse.content.trim() && editedResponse.authorName.trim()
        ? {
          authorName: editedResponse.authorName.trim(),
          responseDate: editedResponse.responseDate || new Date().toISOString().slice(0, 10),
          content: editedResponse.content.trim(),
        }
        : null,
      okinewsUrl: editedOkinewsUrl.trim() || null,
      referenceLinks: editedReferenceLinks,
      referenceFiles: editedReferenceFiles,
      regionalCases: editedRegionalCases,
    });

    // 저장 후 편집 모드 닫기
    setShowBasicInfoEdit(false);
  };

  const handleSaveEdit = async () => {
    await updateAgendaMutation.mutateAsync({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus,
      response: editedResponse.content.trim() ? editedResponse : null,
      okinewsUrl: editedOkinewsUrl.trim() || null,
      referenceLinks: editedReferenceLinks,
      referenceFiles: editedReferenceFiles,
      regionalCases: editedRegionalCases,
    });

    if (editedStatus === "executing" && timelineItems.length > 0) {
      const validItems = timelineItems.filter((item) => item.content.trim());
      if (validItems.length > 0) {
        await saveTimelineItemsMutation.mutateAsync(validItems);
      }
    }
  };

  const handleStatusAction = async (newStatus: any) => {
    try {
      await updateAgendaMutation.mutateAsync({
        title: editedTitle,
        description: editedDescription,
        status: newStatus,
        response: editedResponse.content.trim() ? editedResponse : null,
        okinewsUrl: editedOkinewsUrl.trim() || null,
        referenceLinks: editedReferenceLinks,
        referenceFiles: editedReferenceFiles,
        regionalCases: editedRegionalCases,
      });
      setEditedStatus(newStatus);

      if (newStatus === "executing" && timelineItems.length > 0) {
        const validItems = timelineItems.filter((item) => item.content.trim());
        if (validItems.length > 0) await saveTimelineItemsMutation.mutateAsync(validItems);
      }
      await queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      toast({ title: "상태 변경 완료" });
    } catch (error) {
      toast({ title: "상태 변경 실패", variant: "destructive" });
    }
  };

  // Helper functions for array state management
  const handleAddReferenceLink = () => {
    if (newReferenceLink.trim()) {
      setEditedReferenceLinks([...editedReferenceLinks, newReferenceLink.trim()]);
      setNewReferenceLink("");
    }
  };
  const handleRemoveReferenceLink = (i: number) => setEditedReferenceLinks(editedReferenceLinks.filter((_, idx) => idx !== i));
  const handleRemoveReferenceFile = (i: number) => setEditedReferenceFiles(editedReferenceFiles.filter((_, idx) => idx !== i));
  const handleAddRegionalCase = () => {
    if (newRegionalCase.trim()) {
      setEditedRegionalCases([...editedRegionalCases, newRegionalCase.trim()]);
      setNewRegionalCase("");
    }
  };
  const handleRemoveRegionalCase = (i: number) => setEditedRegionalCases(editedRegionalCases.filter((_, idx) => idx !== i));
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) uploadFileMutation.mutate(e.target.files[0]);
  };

  const getTimelineSteps = (status: string, createdAt: string) => {
    const createdDate = new Date(createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
    const statusOrder = ["created", "voting", "proposing", "answered", "executing", "executed"];
    const currentIndex = statusOrder.indexOf(status);

    const getStepStatus = (stepStatus: string) => {
      const stepIndex = statusOrder.indexOf(stepStatus);
      if (stepIndex < currentIndex) return "completed" as const;
      if (stepIndex === currentIndex) return "current" as const;
      return "upcoming" as const;
    };

    return [
      { label: "안건 생성", status: getStepStatus("created"), date: createdDate },
      { label: "투표 중", status: getStepStatus("voting") },
      { label: "제안 중", status: getStepStatus("proposing") },
      { label: "답변 완료", status: getStepStatus("answered") },
      { label: "실행 중", status: getStepStatus("executing") },
      { label: "실행 완료", status: getStepStatus("executed") },
    ];
  };

  const timelineSteps = useMemo(() => {
    if (!agenda) return [];
    return getTimelineSteps(agenda.status, String(agenda.createdAt));
  }, [agenda]);

  if (!match || !agendaId || agendaError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-muted-foreground">
          {agendaError ? "안건을 불러오는 데 실패했습니다." : "안건을 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  if (agendaLoading || !agenda) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  // Fix: Remove floating comment at the bottom of the selection and re-align DialogContent
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-5xl mx-auto">
        {/* Hero 이미지 섹션 */}
        <div className="relative w-full h-[500px] group">
          <img
            src={
              agenda.imageUrl ||
              "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop"
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
                onEditClick={handleEditClick}
                bookmarkLoading={bookmarkMutation.isPending}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-10 md:px-6 md:py-12 space-y-12">
          {/* 안건 소개 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">안건 소개</h2>
            <Card className="p-6 lg: py-14">
              <p className="text-base leading-relaxed whitespace-pre-wrap break-keep" data-testid="text-description">
                {agenda.description}
              </p>
            </Card>
          </div>

          {/* 타임라인 */}
          <Timeline steps={timelineSteps} />

          {/* 👇 agenda.status가 'voting'이 아니면 true가 돼서 비활성화됨 */}
          <VotingWidget
            agreeCount={voteStats?.agree || 0}
            neutralCount={voteStats?.neutral || 0}
            disagreeCount={voteStats?.disagree || 0}
            userVote={userVote?.voteType}
            onVote={handleVote}
            status={agenda.status}
            disabled={voteMutation.isPending}
          />

          {/* 관련 주민의견과 참고자료를 한 행에 배치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* 관련 주민의견 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">관련 주민의견</h2>
              </div>

              {opinionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {/* 1. 의견 리스트 영역 (데이터 유무에 따라 내용 갈아끼우기) */}
                  {relatedOpinions.length > 0 ? (
                    <>
                      {/* 의견이 있을 때: 리스트 3개 + 전체보기 버튼 */}
                      {relatedOpinions.slice(0, 3).map((opinion) => (
                        <OpinionCard
                          key={opinion.id}
                          id={opinion.id}
                          authorName="익명"
                          content={opinion.content}
                          likeCount={opinion.likes}
                          commentCount={0}
                          timestamp={new Date(opinion.createdAt).toLocaleDateString("ko-KR")}
                          onClick={() => setLocation(`/opinion/${opinion.id}`)}
                        />
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/agendas/${agendaId}/opinions`)}
                        data-testid="button-view-all-opinions-bottom"
                      >
                        주민의견 전체보기 ({relatedOpinions.length}개)
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    /* 의견이 없을 때: 안내 카드 표시 */
                    <Card className="p-8 text-center bg-ok_gray1 border-dashed border-gray-200 shadow-none">
                      <p className="text-muted-foreground font-medium mb-1">아직 등록된 의견이 없습니다.</p>
                      <p className="text-xs text-gray-400">가장 먼저 소중한 의견을 남겨주세요! 🌱</p>
                    </Card>
                  )}

                  {/* 2. 의견 작성 버튼 (★ 항상 보임 + 중앙 정렬) */}
                  <div className="flex justify-center mt-2">
                    <Button
                      className="px-8 h-10 text-sm rounded-full font-bold shadow-sm hover:shadow-md transition-all"
                      onClick={() => setLocation(`/agendas/${agendaId}/opinions`)} // 작성 페이지로 이동
                      data-testid="button-write-opinion"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      의견 작성하기
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 참고자료 섹션 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">참고자료</h2>
              <div className="space-y-3">
                {/* 옥천신문 */}
                {agenda?.okinewsUrl ? (
                  <Card
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                    data-testid="card-okinews-link"
                    onClick={() => window.open(agenda.okinewsUrl!, "_blank")}
                  >
                    <div className="flex items-center gap-4">
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                            옥천신문
                          </span>
                        </div>
                        <h4
                          className="font-medium text-sm truncate"
                          title={agenda.okinewsUrl}
                        >
                          {agenda.okinewsUrl.length > 60
                            ? `${agenda.okinewsUrl.substring(0, 60)}...`
                            : agenda.okinewsUrl}
                        </h4>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                            옥천신문
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          아직 취재 전이에요.{" "}
                          <button
                            className="text-primary hover:underline"
                            onClick={() =>
                              window.open(
                                "http://www.okinews.com/bbs/writeForm.html?mode=input&table=bbs_43&category=",
                                "_blank"
                              )
                            }
                            data-testid="button-request-coverage"
                          >
                            취재 요청하기
                          </button>
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 참고링크 - 1개만 표시 */}
                {agenda?.referenceLinks && agenda.referenceLinks.length > 0 ? (
                  <Card
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                    data-testid="card-reference-link-0"
                    onClick={() => window.open(agenda.referenceLinks![0], "_blank")}
                  >
                    <div className="flex items-center gap-4">
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                            외부 링크
                          </span>
                        </div>
                        <h4
                          className="font-medium text-sm truncate"
                          title={agenda.referenceLinks[0]}
                        >
                          {agenda.referenceLinks[0].length > 60
                            ? `${agenda.referenceLinks[0].substring(0, 60)}...`
                            : agenda.referenceLinks[0]}
                        </h4>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* 첨부파일 - 1개만 표시 */}
                {agenda?.referenceFiles && agenda.referenceFiles.length > 0 ? (
                  <Card
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                    data-testid="card-reference-file-0"
                    onClick={() => window.open(agenda.referenceFiles![0], "_blank")}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                            첨부 파일
                          </span>
                        </div>
                        <h4
                          className="font-medium text-sm truncate"
                          title={agenda.referenceFiles[0]}
                        >
                          {(file => {
                            const fileName = file.split("/").pop() || file;
                            return fileName.length > 40
                              ? `${fileName.substring(0, 40)}...`
                              : fileName;
                          })(agenda.referenceFiles[0])}
                        </h4>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* 타 지역 정책 사례 - 1개만 표시 */}
                {agenda?.regionalCases && agenda.regionalCases.length > 0 ? (
                  <Card className="p-4" data-testid="card-regional-case-0">
                    <div className="flex items-start gap-4">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                            타 지역 정책 사례
                          </span>
                        </div>
                        <p
                          className="text-sm line-clamp-2"
                          title={agenda.regionalCases[0]}
                        >
                          {agenda.regionalCases[0].length > 100
                            ? `${agenda.regionalCases[0].substring(0, 100)}...`
                            : agenda.regionalCases[0]}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* 참고자료가 없는 경우 */}
                {(!agenda?.okinewsUrl || !agenda?.referenceLinks?.length) &&
                  !agenda?.referenceFiles?.length &&
                  !agenda?.regionalCases?.length ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">등록된 참고자료가 없습니다.</p>
                  </Card>
                ) : null}
              </div>

              {/* 참고자료 더보기 버튼 */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/agendas/${agendaId}/references`)}
                data-testid="button-view-all-references-bottom"
              >
                참고자료 전체보기
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* 제안에 대한 답변 */}
          {(agenda.status === "answered" ||
            agenda.status === "executing" ||
            agenda.status === "executed") && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">제안에 대한 답변</h2>
                {agenda.response &&
                  (typeof agenda.response === "object" && "content" in agenda.response
                    ? (agenda.response as { content: string }).content
                    : typeof agenda.response === "string"
                      ? agenda.response
                      : null) ? (
                  <div className="flex gap-4">
                    {/* 말풍선 꼬리 */}
                    <div className="flex-shrink-0 w-2">
                      <div className="w-full h-full bg-muted"></div>
                    </div>
                    {/* 말풍선 내용 */}
                    <Card className="flex-1 p-6 relative">
                      <div className="absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-card border-b-[8px] border-b-transparent"></div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                              {(
                                typeof agenda.response === "object" &&
                                  "authorName" in agenda.response
                                  ? (agenda.response as { authorName: string }).authorName
                                  : "관리자"
                              )[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {typeof agenda.response === "object" &&
                                  "authorName" in agenda.response
                                  ? (agenda.response as { authorName: string })
                                    .authorName
                                  : "관리자"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {typeof agenda.response === "object" &&
                                  "responseDate" in agenda.response &&
                                  (agenda.response as { responseDate?: string }).responseDate
                                  ? new Date(
                                    (agenda.response as { responseDate: string })
                                      .responseDate
                                  ).toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                  : new Date().toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p
                            className="text-base leading-relaxed whitespace-pre-wrap"
                            data-testid="text-agenda-response"
                          >
                            {typeof agenda.response === "object" &&
                              "content" in agenda.response
                              ? (agenda.response as { content: string }).content
                              : typeof agenda.response === "string"
                                ? agenda.response
                                : ""}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card className="p-6">
                    <p className="text-muted-foreground">답변이 등록되지 않았습니다.</p>
                  </Card>
                )}
              </div>
            )}

          {/* 실행 과정 */}
          {(agenda.status === "executing" || agenda.status === "executed") && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">실행 과정</h2>
              {executionTimelineLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : executionTimelineItems.length > 0 ? (
                <div className="space-y-6">
                  {[...executionTimelineItems]
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      return dateA - dateB; // 오름차순 (오래된 것부터)
                    })
                    .map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-4 border-background shadow-md">
                              {index + 1}
                            </div>
                            {index < executionTimelineItems.length - 1 && (
                              <div className="w-0.5 h-full min-h-16 bg-muted-foreground/20 mt-2"></div>
                            )}
                          </div>

                          <Card className="flex-1 p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="font-semibold text-lg">{item.authorName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(item.createdAt).toLocaleDateString(
                                      "ko-KR",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                                {user?.isAdmin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "이 실행 과정을 삭제하시겠습니까?"
                                        )
                                      ) {
                                        deleteTimelineItemMutation.mutate(item.id);
                                      }
                                    }}
                                    disabled={deleteTimelineItemMutation.isPending}
                                    data-testid={`button-delete-timeline-item-${item.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-base leading-relaxed whitespace-pre-wrap">
                                {item.content}
                              </p>
                              {item.imageUrl && (
                                <div className="rounded-lg overflow-hidden border">
                                  <img
                                    src={item.imageUrl}
                                    alt="실행 과정 이미지"
                                    className="w-full h-auto max-h-96 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">
                    아직 등록된 실행 과정이 없습니다.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-testid="dialog-edit-agenda"
          closeButtonTestId="button-close-edit-dialog"
        >
          <DialogHeader>
            <DialogTitle>안건 수정</DialogTitle>
            <DialogDescription>
              안건의 정보를 수정하고 참고자료를 관리할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 타임라인 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-12">진행상황</h2>

              {(() => {
                const timelineSteps = getTimelineSteps(
                  editedStatus,
                  agenda?.createdAt
                    ? String(agenda.createdAt)
                    : new Date().toISOString()
                );
                return (
                  <div className="space-y-6">
                    {timelineSteps.map((step, index) => {
                      const stepStatus = step.status;
                      const stepLabel = step.label;
                      let actionButton = null;

                      if (
                        stepLabel === "안건 생성" &&
                        (stepStatus === "completed" || stepStatus === "current")
                      ) {
                        actionButton = (
                          <div className="mt-4 space-y-4">
                            {!showBasicInfoEdit ? (
                              <div className="space-y-3">
                                <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">제목</p>
                                    <p className="text-sm">
                                      {editedTitle || "제목이 입력되지 않았습니다."}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">설명</p>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {editedDescription || "설명이 입력되지 않았습니다."}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">참고자료</p>
                                    <p className="text-sm">
                                      {editedOkinewsUrl ||
                                        editedReferenceLinks.length > 0 ||
                                        editedReferenceFiles.length > 0 ||
                                        editedRegionalCases.length > 0
                                        ? `${editedOkinewsUrl
                                          ? "옥천신문 링크 있음, "
                                          : ""
                                        }${editedReferenceLinks.length}개 링크, ${editedReferenceFiles.length
                                        }개 파일, ${editedRegionalCases.length}개 사례`
                                        : "참고자료가 없습니다."}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => setShowBasicInfoEdit(true)}
                                  variant="outline"
                                  className="w-full"
                                  data-testid="button-edit-basic-info"
                                >
                                  기본 정보 편집하기
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-title">제목</Label>
                                  <Input
                                    id="edit-title"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    placeholder="안건 제목을 입력하세요"
                                    data-testid="input-edit-title"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-description">설명</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    placeholder="안건 설명을 입력하세요"
                                    className="min-h-32"
                                    data-testid="textarea-edit-description"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>참고자료</Label>
                                  <div className="space-y-2">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-okinews-url" className="text-sm">
                                        옥천신문 링크
                                      </Label>
                                      <Input
                                        id="edit-okinews-url"
                                        value={editedOkinewsUrl}
                                        onChange={(e) => setEditedOkinewsUrl(e.target.value)}
                                        placeholder="http://www.okinews.com/..."
                                        data-testid="input-edit-okinews-url"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">참고 링크</Label>
                                      <div className="space-y-2">
                                        {editedReferenceLinks.map((link, linkIndex) => (
                                          <div
                                            key={linkIndex}
                                            className="flex items-center gap-2 min-w-0"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <Input
                                                value={link}
                                                onChange={(e) => {
                                                  const newLinks = [...editedReferenceLinks];
                                                  newLinks[linkIndex] = e.target.value;
                                                  setEditedReferenceLinks(newLinks);
                                                }}
                                                className="w-full"
                                                data-testid={`input-reference-link-${linkIndex}`}
                                              />
                                            </div>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => handleRemoveReferenceLink(linkIndex)}
                                              data-testid={`button-remove-reference-link-${linkIndex}`}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                        <div className="flex items-center gap-2">
                                          <Input
                                            value={newReferenceLink}
                                            onChange={(e) => setNewReferenceLink(e.target.value)}
                                            placeholder="https://example.com"
                                            className="flex-1"
                                            data-testid="input-add-reference-link"
                                          />
                                          <Button
                                            variant="outline"
                                            onClick={handleAddReferenceLink}
                                            disabled={!newReferenceLink.trim()}
                                            data-testid="button-add-reference-link"
                                          >
                                            <Plus className="w-4 h-4 mr-1" />
                                            추가
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">첨부 파일</Label>
                                      <div className="space-y-2">
                                        {editedReferenceFiles.map((file, fileIndex) => (
                                          <div
                                            key={fileIndex}
                                            className="flex items-center gap-2 min-w-0"
                                          >
                                            <div className="flex-1 min-w-0 flex items-center gap-2 p-2 border rounded-md overflow-hidden">
                                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                              <span
                                                className="text-sm truncate min-w-0 flex-1 block"
                                                title={file.split("/").pop() || file}
                                              >
                                                {file.split("/").pop() || file}
                                              </span>
                                            </div>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => handleRemoveReferenceFile(fileIndex)}
                                              data-testid={`button-remove-reference-file-${fileIndex}`}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                        <div>
                                          <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            data-testid="input-file-upload"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadFileMutation.isPending}
                                            className="w-full"
                                            data-testid="button-upload-file"
                                          >
                                            <Upload className="w-4 h-4 mr-2" />
                                            {uploadFileMutation.isPending
                                              ? "업로드 중..."
                                              : "파일 업로드"}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">타 지역 정책 사례</Label>
                                      <div className="space-y-2">
                                        {editedRegionalCases.map(
                                          (caseItem, caseIndex) => (
                                            <div
                                              key={caseIndex}
                                              className="flex items-center gap-2 min-w-0"
                                            >
                                              <div className="flex-1 min-w-0">
                                                <Input
                                                  value={caseItem}
                                                  onChange={(e) => {
                                                    const newCases = [
                                                      ...editedRegionalCases,
                                                    ];
                                                    newCases[caseIndex] =
                                                      e.target.value;
                                                    setEditedRegionalCases(
                                                      newCases
                                                    );
                                                  }}
                                                  className="w-full"
                                                  data-testid={`input-regional-case-${caseIndex}`}
                                                />
                                              </div>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                  handleRemoveRegionalCase(
                                                    caseIndex
                                                  )
                                                }
                                                data-testid={`button-remove-regional-case-${caseIndex}`}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          )
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Input
                                            value={newRegionalCase}
                                            onChange={(e) =>
                                              setNewRegionalCase(e.target.value)
                                            }
                                            placeholder="예: 서울시 ○○구의 ○○ 정책 사례"
                                            className="flex-1"
                                            data-testid="input-add-regional-case"
                                          />
                                          <Button
                                            variant="outline"
                                            onClick={handleAddRegionalCase}
                                            disabled={!newRegionalCase.trim()}
                                            data-testid="button-add-regional-case"
                                          >
                                            <Plus className="w-4 h-4 mr-1" />
                                            추가
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowBasicInfoEdit(false)}
                                    className="flex-1"
                                    data-testid="button-cancel-basic-info-edit"
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    onClick={handleSaveBasicInfo}
                                    disabled={updateAgendaMutation.isPending}
                                    className="flex-1"
                                    data-testid="button-save-basic-info"
                                  >
                                    {updateAgendaMutation.isPending ? "저장 중..." : "저장"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else if (
                        stepLabel === "투표 중" &&
                        editedStatus === "voting" &&
                        stepStatus === "current"
                      ) {
                        actionButton = (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleStatusAction("proposing")}
                              className="w-full"
                              data-testid="button-complete-voting"
                            >
                              투표 완료하기
                            </Button>
                          </div>
                        );
                      } else if (
                        stepLabel === "제안 중" &&
                        editedStatus === "proposing" &&
                        stepStatus === "current"
                      ) {
                        actionButton = (
                          <div className="mt-4 space-y-2">
                            {!showResponseInput ? (
                              <Button
                                onClick={() => setShowResponseInput(true)}
                                className="w-full"
                                data-testid="button-input-response"
                              >
                                제안에 대한 답변 입력하기
                              </Button>
                            ) : (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-author">
                                    답변자
                                  </Label>
                                  <Input
                                    id="edit-response-author"
                                    value={editedResponse.authorName}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        authorName: e.target.value,
                                      })
                                    }
                                    placeholder="답변자 이름을 입력하세요"
                                    data-testid="input-edit-response-author"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-date">
                                    답변 날짜
                                  </Label>
                                  <Input
                                    id="edit-response-date"
                                    type="date"
                                    value={editedResponse.responseDate}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        responseDate: e.target.value,
                                      })
                                    }
                                    data-testid="input-edit-response-date"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-content">
                                    제안에 대한 답변
                                  </Label>
                                  <Textarea
                                    id="edit-response-content"
                                    value={editedResponse.content}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        content: e.target.value,
                                      })
                                    }
                                    placeholder="제안에 대한 답변을 입력하세요"
                                    className="min-h-32"
                                    data-testid="textarea-edit-response"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowResponseInput(false)}
                                    className="flex-1"
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (
                                        editedResponse.content.trim() &&
                                        editedResponse.authorName.trim()
                                      ) {
                                        handleStatusAction("executing");
                                        setShowResponseInput(false);
                                      } else {
                                        toast({
                                          title: "답변을 입력하세요",
                                          description:
                                            "답변자와 답변 내용을 모두 입력해야 다음 단계로 진행할 수 있습니다.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="flex-1"
                                    data-testid="button-complete-response"
                                  >
                                    답변 완료
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else if (
                        stepLabel === "답변 완료" &&
                        (editedStatus === "answered" ||
                          editedStatus === "executing" ||
                          editedStatus === "executed") &&
                        (stepStatus === "completed" ||
                          stepStatus === "current")
                      ) {
                        actionButton = (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit-response">
                                제안에 대한 답변
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowResponseInput(!showResponseInput)
                                }
                                data-testid="button-toggle-response"
                              >
                                {showResponseInput ? "숨기기" : "수정하기"}
                              </Button>
                            </div>
                            {showResponseInput ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-author">
                                    답변자
                                  </Label>
                                  <Input
                                    id="edit-response-author"
                                    value={editedResponse.authorName}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        authorName: e.target.value,
                                      })
                                    }
                                    placeholder="답변자 이름을 입력하세요"
                                    data-testid="input-edit-response-author"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-date">
                                    답변 날짜
                                  </Label>
                                  <Input
                                    id="edit-response-date"
                                    type="date"
                                    value={editedResponse.responseDate}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        responseDate: e.target.value,
                                      })
                                    }
                                    data-testid="input-edit-response-date"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-response-content">
                                    제안에 대한 답변
                                  </Label>
                                  <Textarea
                                    id="edit-response-content"
                                    value={editedResponse.content}
                                    onChange={(e) =>
                                      setEditedResponse({
                                        ...editedResponse,
                                        content: e.target.value,
                                      })
                                    }
                                    placeholder="제안에 대한 답변을 입력하세요"
                                    className="min-h-32"
                                    data-testid="textarea-edit-response"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border rounded-md bg-muted/50">
                                {editedResponse.content ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                                        {editedResponse.authorName[0] ||
                                          "관"}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {editedResponse.authorName ||
                                            "관리자"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {editedResponse.responseDate
                                            ? new Date(
                                              editedResponse.responseDate
                                            ).toLocaleDateString("ko-KR", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                            })
                                            : new Date().toLocaleDateString(
                                              "ko-KR",
                                              {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                              }
                                            )}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap pt-2 border-t">
                                      {editedResponse.content}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    답변이 입력되지 않았습니다.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      } else if (
                        stepLabel === "실행 중" &&
                        (editedStatus === "executing" ||
                          editedStatus === "executed") &&
                        (stepStatus === "current" ||
                          stepStatus === "completed")
                      ) {
                        actionButton = (
                          <div className="mt-4 space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setExecutionTimelineDialogOpen(true)}
                              className="w-full"
                              data-testid="button-manage-execution-timeline"
                            >
                              실행 과정 관리
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                            {editedStatus === "executing" && (
                              <Button
                                onClick={() => handleStatusAction("executed")}
                                className="w-full"
                                data-testid="button-complete-executing"
                              >
                                실행 완료
                              </Button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-4 items-start">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepStatus === "completed"
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : stepStatus === "current"
                                    ? "border-primary bg-background"
                                    : "border-muted-foreground/25 bg-background"
                                  }`}
                              >
                                {stepStatus === "completed" && (
                                  <Check className="w-4 h-4" />
                                )}
                                {stepStatus === "current" && (
                                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                                )}
                              </div>
                              {index < timelineSteps.length - 1 && (
                                <div
                                  className={`w-0.5 min-h-12 ${stepStatus === "completed"
                                    ? "bg-primary"
                                    : "bg-muted-foreground/25"
                                    }`}
                                ></div>
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p
                                className={`font-medium ${stepStatus === "upcoming"
                                  ? "text-muted-foreground/80"
                                  : ""
                                  }`}
                              >
                                {step.label}
                              </p>
                              {step.date && (
                                <p className="text-sm text-muted-foreground">
                                  {step.date}
                                </p>
                              )}
                              {actionButton}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 테스트용 상태 직접 변경 */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">상태 (테스트용)</Label>
              <Select
                value={editedStatus}
                onValueChange={(value: any) => setEditedStatus(value)}
              >
                <SelectTrigger
                  id="edit-status"
                  data-testid="select-edit-status"
                >
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">안건 생성</SelectItem>
                  <SelectItem value="voting">투표 중</SelectItem>
                  <SelectItem value="proposing">제안 중</SelectItem>
                  <SelectItem value="answered">답변 완료</SelectItem>
                  <SelectItem value="executing">실행 중</SelectItem>
                  <SelectItem value="executed">실행 완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={
                updateAgendaMutation.isPending ||
                saveTimelineItemsMutation.isPending
              }
              data-testid="button-save-edit"
            >
              {updateAgendaMutation.isPending ||
                saveTimelineItemsMutation.isPending
                ? "저장 중..."
                : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 참고자료 관리 모달 */}
      <Dialog open={referenceDialogOpen} onOpenChange={setReferenceDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-testid="dialog-edit-references"
        >
          <DialogHeader>
            <DialogTitle>참고자료 관리</DialogTitle>
            <DialogDescription>
              안건의 참고자료를 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-okinews-url">옥천신문 링크</Label>
              <Input
                id="edit-okinews-url"
                value={editedOkinewsUrl}
                onChange={(e) => setEditedOkinewsUrl(e.target.value)}
                placeholder="http://www.okinews.com/..."
                data-testid="input-edit-okinews-url"
              />
            </div>

            <div className="space-y-2">
              <Label>참고 링크</Label>
              <div className="space-y-2">
                {editedReferenceLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={link}
                        readOnly
                        className="w-full"
                        style={{ textOverflow: "ellipsis" }}
                        title={link}
                        data-testid={`input-reference-link-${index}`}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveReferenceLink(index)}
                      data-testid={`button-remove-reference-link-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newReferenceLink}
                    onChange={(e) => setNewReferenceLink(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                    data-testid="input-add-reference-link"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddReferenceLink}
                    disabled={!newReferenceLink.trim()}
                    data-testid="button-add-reference-link"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>첨부 파일</Label>
              <div className="space-y-2">
                {editedReferenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0 flex items-center gap-2 p-2 border rounded-md overflow-hidden">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span
                        className="text-sm truncate min-w-0 flex-1 block"
                        title={file.split("/").pop() || file}
                      >
                        {file.split("/").pop() || file}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveReferenceFile(index)}
                      data-testid={`button-remove-reference-file-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFileMutation.isPending}
                    className="w-full"
                    data-testid="button-upload-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadFileMutation.isPending
                      ? "업로드 중..."
                      : "파일 업로드"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>타 지역 정책 사례</Label>
              <div className="space-y-2">
                {editedRegionalCases.map((caseItem, index) => (
                  <div key={index} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={caseItem}
                        readOnly
                        className="w-full"
                        title={caseItem}
                        data-testid={`input-regional-case-${index}`}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRegionalCase(index)}
                      data-testid={`button-remove-regional-case-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newRegionalCase}
                    onChange={(e) => setNewRegionalCase(e.target.value)}
                    placeholder="예: 서울시 ○○구의 ○○ 정책 사례"
                    className="flex-1"
                    data-testid="input-add-regional-case"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddRegionalCase}
                    disabled={!newRegionalCase.trim()}
                    data-testid="button-add-regional-case"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReferenceDialogOpen(false)}
              data-testid="button-close-reference-dialog"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 실행 과정 관리 모달 */}
      <Dialog
        open={executionTimelineDialogOpen}
        onOpenChange={async (open) => {
          setExecutionTimelineDialogOpen(open);
          // 모달이 열릴 때 기존 실행 과정 불러오기
          if (open && (agenda?.status === "executing" || agenda?.status === "executed")) {
            // 쿼리 새로고침
            await queryClient.invalidateQueries({
              queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
            });

            // 데이터 가져오기
            const { data: items } = await queryClient.fetchQuery({
              queryKey: [`/api/agendas/${agendaId}/execution-timeline`],
              queryFn: async () => {
                const res = await fetch(`/api/agendas/${agendaId}/execution-timeline`, {
                  credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch timeline items");
                return res.json();
              },
            });

            if (items && items.length > 0) {
              setTimelineItems(
                items.map((item: ExecutionTimelineItem) => ({
                  id: item.id,
                  authorName: item.authorName,
                  content: item.content,
                  image: null,
                  date: new Date(item.createdAt).toISOString().slice(0, 10),
                  imagePreview: item.imageUrl || undefined,
                  existingImageUrl: item.imageUrl || undefined,
                }))
              );
            } else {
              setTimelineItems([]);
            }
          } else if (open) {
            setTimelineItems([]);
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-testid="dialog-manage-execution-timeline"
        >
          <DialogHeader>
            <DialogTitle>실행 과정 관리</DialogTitle>
            <DialogDescription>
              안건의 실행 과정을 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <Label>실행 과정 항목</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newId = `temp-${Date.now()}`;
                  setTimelineItems([
                    ...timelineItems,
                    {
                      id: newId,
                      authorName: "",
                      content: "",
                      image: null,
                      date: new Date().toISOString().slice(0, 10),
                    },
                  ]);
                }}
                data-testid="button-add-timeline-item-form"
              >
                <Plus className="w-4 h-4 mr-1" />
                항목 추가
              </Button>
            </div>

            {timelineItems.length > 0 && (
              <div className="space-y-4">
                {timelineItems.map((item, index) => {
                  const isExisting = item.id && !item.id.startsWith("temp-");
                  return (
                    <Card key={item.id} className="p-4 space-y-4">
                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (isExisting) {
                              // 기존 아이템은 서버에서 삭제
                              if (confirm("이 실행 과정을 삭제하시겠습니까?")) {
                                deleteTimelineItemMutation.mutate(item.id!);
                              }
                            } else {
                              // 새 아이템은 로컬에서만 제거
                              setTimelineItems(timelineItems.filter((i) => i.id !== item.id));
                              if (item.imagePreview && !item.existingImageUrl) {
                                URL.revokeObjectURL(item.imagePreview);
                              }
                            }
                          }}
                          data-testid={`button-remove-timeline-item-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* 모든 아이템 편집 가능 */}
                      <div className="space-y-2">
                        <Label htmlFor={`timeline-author-${item.id}`}>작성자</Label>
                        <Input
                          id={`timeline-author-${item.id}`}
                          type="text"
                          value={item.authorName}
                          onChange={(e) => {
                            setTimelineItems(
                              timelineItems.map((i) =>
                                i.id === item.id ? { ...i, authorName: e.target.value } : i
                              )
                            );
                          }}
                          placeholder="작성자 이름을 입력하세요"
                          data-testid={`input-timeline-author-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`timeline-date-${item.id}`}>날짜</Label>
                        <Input
                          id={`timeline-date-${item.id}`}
                          type="date"
                          value={item.date}
                          onChange={(e) => {
                            setTimelineItems(
                              timelineItems.map((i) =>
                                i.id === item.id ? { ...i, date: e.target.value } : i
                              )
                            );
                          }}
                          data-testid={`input-timeline-date-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`timeline-content-${item.id}`}>내용</Label>
                        <Textarea
                          id={`timeline-content-${item.id}`}
                          value={item.content}
                          onChange={(e) => {
                            setTimelineItems(
                              timelineItems.map((i) =>
                                i.id === item.id ? { ...i, content: e.target.value } : i
                              )
                            );
                          }}
                          placeholder="실행 과정을 입력하세요"
                          className="min-h-24"
                          data-testid={`textarea-timeline-content-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`timeline-image-${item.id}`}>
                          이미지 (선택사항)
                        </Label>
                        <div className="space-y-2">
                          {item.imagePreview && (
                            <div className="relative">
                              <img
                                src={item.imagePreview}
                                alt="미리보기"
                                className="w-full h-auto max-h-48 object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  if (item.imagePreview && !item.existingImageUrl) {
                                    // 새로 선택한 이미지만 URL 해제
                                    URL.revokeObjectURL(item.imagePreview);
                                  }
                                  setTimelineItems(
                                    timelineItems.map((i) =>
                                      i.id === item.id
                                        ? { ...i, image: null, imagePreview: undefined, existingImageUrl: undefined }
                                        : i
                                    )
                                  );
                                  const input = timelineImageInputRefs.current[item.id];
                                  if (input) {
                                    input.value = "";
                                  }
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          <input
                            ref={(el) => {
                              timelineImageInputRefs.current[item.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const preview = URL.createObjectURL(file);
                                setTimelineItems(
                                  timelineItems.map((i) =>
                                    i.id === item.id
                                      ? { ...i, image: file, imagePreview: preview }
                                      : i
                                  )
                                );
                              }
                            }}
                            data-testid={`input-timeline-image-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = timelineImageInputRefs.current[item.id];
                              input?.click();
                            }}
                            className="w-full"
                            data-testid={`button-select-timeline-image-${index}`}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {item.imagePreview ? "이미지 변경" : "이미지 선택"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {timelineItems.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  실행 과정 항목을 추가하려면 "항목 추가" 버튼을 클릭하세요.
                </p>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExecutionTimelineDialogOpen(false)}
              data-testid="button-close-execution-timeline-dialog"
            >
              닫기
            </Button>
            <Button
              onClick={async () => {
                // 실행 과정 저장
                if (timelineItems.length > 0) {
                  const validItems = timelineItems.filter(
                    (item) => item.content.trim() && item.authorName.trim()
                  );
                  if (validItems.length > 0) {
                    await saveTimelineItemsMutation.mutateAsync(
                      validItems.map((item) => ({
                        id: item.id,
                        authorName: item.authorName.trim(),
                        content: item.content.trim(),
                        image: item.image || undefined,
                        date: item.date,
                        existingImageUrl: item.existingImageUrl,
                        imagePreview: item.imagePreview,
                      }))
                    );
                  }
                }
                setExecutionTimelineDialogOpen(false);
              }}
              disabled={saveTimelineItemsMutation.isPending}
              data-testid="button-save-execution-timeline"
            >
              {saveTimelineItemsMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
}
