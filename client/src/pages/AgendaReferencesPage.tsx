import Header from "@/components/Header";
import AgendaHeader from "@/components/AgendaHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Upload, ExternalLink, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import type { Agenda, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";

interface AgendaWithCategory extends Agenda {
  category?: Category;
  isBookmarked?: boolean;
}

interface BookmarkStatus {
  isBookmarked: boolean;
  bookmarkCount: number;
}

export default function AgendaReferencesPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/agendas/:id/references");
  const agendaId = params?.id;
  const { toast } = useToast();

  const [showOkinewsForm, setShowOkinewsForm] = useState(false);
  const [showReferenceLinkForm, setShowReferenceLinkForm] = useState(false);
  const [showRegionalCaseForm, setShowRegionalCaseForm] = useState(false);
  const [tempOkinewsUrl, setTempOkinewsUrl] = useState("");
  const [tempReferenceLink, setTempReferenceLink] = useState("");
  const [tempRegionalCase, setTempRegionalCase] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        queryClient.setQueryData<BookmarkStatus>([bookmarkStatusQueryKey], {
          ...previousStatus,
          isBookmarked: !isBookmarked,
          bookmarkCount: isBookmarked ? Math.max(0, prevCount - 1) : prevCount + 1,
        });
      }
      
      return { previousStatus };
    },
    onError: (err, isBookmarked, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousStatus) {
        queryClient.setQueryData([bookmarkStatusQueryKey], context.previousStatus);
      }
      toast({
        title: "북마크 실패",
        description: "북마크 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // 성공 시 쿼리 무효화하여 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: [bookmarkStatusQueryKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/agendas/bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/stats"] });
    },
  });

  const updateAgendaMutation = useMutation({
    mutationFn: async (data: {
      okinewsUrl?: string | null;
      referenceLinks?: string[];
      referenceFiles?: string[];
      regionalCases?: string[];
    }) => {
      const res = await apiRequest("PATCH", `/api/agendas/${agendaId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agendas/${agendaId}`] });
      toast({
        title: "참고자료가 업데이트되었습니다",
        description: "변경사항이 성공적으로 저장되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "업데이트 실패",
        description: "참고자료를 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.isAdmin) {
        throw new Error("관리자 권한이 필요합니다.");
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch(`/api/agendas/${agendaId}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("File upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/agendas/${agendaId}`],
      });
      toast({
        title: "파일 업로드 완료",
        description: "파일이 성공적으로 업로드되었습니다.",
      });
    },
    onError: (error) => {
      const msg =
        error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.";
      toast({
        title: "업로드 실패",
        description: msg,
        variant: "destructive",
      });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!user?.isAdmin) {
        toast({
          title: "관리자만 업로드할 수 있어요",
          description: "권한이 없어 업로드가 불가능합니다.",
          variant: "destructive",
        });
        return;
      }
      uploadFileMutation.mutate(file);
      e.target.value = "";
    }
  };

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-6">
            <AgendaHeader
              agenda={{
                ...agenda,
                isBookmarked:
                  bookmarkStatus?.isBookmarked ?? agenda?.isBookmarked,
              }}
              user={user as any}
              onBookmarkClick={handleBookmarkClick}
              bookmarkLoading={bookmarkMutation.isPending}
              showBackButton={true}
            />

          <div className="space-y-8">
            <h2 className="text-xl font-semibold">참고자료</h2>

            {/* 2x2 그리드 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* 옥천신문 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">옥천신문</h3>
                  {user && !agenda?.okinewsUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOkinewsForm(!showOkinewsForm)}
                      data-testid="button-add-okinews"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  )}
                </div>
                <div>
                {showOkinewsForm && (
                  <Card className="p-4 mb-3">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="옥천신문 기사 URL을 입력하세요"
                        value={tempOkinewsUrl}
                        onChange={(e) => setTempOkinewsUrl(e.target.value)}
                        data-testid="input-add-okinews-url"
                      />
                      <Button
                        onClick={() => {
                          if (tempOkinewsUrl.trim()) {
                            updateAgendaMutation.mutate({
                              okinewsUrl: tempOkinewsUrl.trim(),
                            });
                            setTempOkinewsUrl("");
                            setShowOkinewsForm(false);
                          }
                        }}
                        disabled={!tempOkinewsUrl.trim() || updateAgendaMutation.isPending}
                        data-testid="button-submit-okinews"
                      >
                        {updateAgendaMutation.isPending ? "추가 중..." : "추가"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowOkinewsForm(false);
                          setTempOkinewsUrl("");
                        }}
                        data-testid="button-cancel-okinews"
                      >
                        취소
                      </Button>
                    </div>
                  </Card>
                )}
                {agenda?.okinewsUrl ? (
                  <Card
                    className="p-6 hover-elevate active-elevate-2 cursor-pointer min-h-[120px]"
                    data-testid="card-okinews-link"
                    onClick={() => window.open(agenda.okinewsUrl!, "_blank")}
                  >
                    <div className="flex items-center gap-4">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-medium break-all">
                          {agenda.okinewsUrl}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          옥천신문 기사
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : !showOkinewsForm ? (
                  <Card className="p-6 text-center flex flex-col justify-center min-h-[120px]">
                    <p className="text-muted-foreground mb-4">
                      아직 취재 전이에요. 취재를 요청해보세요.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "http://www.okinews.com/bbs/writeForm.html?mode=input&table=bbs_43&category=",
                          "_blank",
                        )
                      }
                      data-testid="button-request-coverage"
                    >
                      취재 요청하기
                    </Button>
                  </Card>
                ) : null}
                </div>
              </div>

              {/* 참고링크 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">참고링크</h3>
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReferenceLinkForm(!showReferenceLinkForm)}
                      data-testid="button-add-reference-link"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  )}
                </div>
                <div>
                {showReferenceLinkForm && (
                  <Card className="p-4 mb-3">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="참고링크 URL을 입력하세요"
                        value={tempReferenceLink}
                        onChange={(e) => setTempReferenceLink(e.target.value)}
                        data-testid="input-add-reference-link"
                      />
                      <Button
                        onClick={() => {
                          if (tempReferenceLink.trim()) {
                            const currentLinks = agenda?.referenceLinks || [];
                            updateAgendaMutation.mutate({
                              referenceLinks: [...currentLinks, tempReferenceLink.trim()],
                            });
                            setTempReferenceLink("");
                            setShowReferenceLinkForm(false);
                          }
                        }}
                        disabled={!tempReferenceLink.trim() || updateAgendaMutation.isPending}
                        data-testid="button-submit-reference-link"
                      >
                        {updateAgendaMutation.isPending ? "추가 중..." : "추가"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReferenceLinkForm(false);
                          setTempReferenceLink("");
                        }}
                        data-testid="button-cancel-reference-link"
                      >
                        취소
                      </Button>
                    </div>
                  </Card>
                )}
                {agenda?.referenceLinks && agenda.referenceLinks.length > 0 ? (
                  <div className="space-y-3">
                    {agenda.referenceLinks.map((link, index) => (
                      <Card
                        key={`link-${index}`}
                        className="p-6 hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`card-reference-link-${index}`}
                        onClick={() => window.open(link, "_blank")}
                      >
                        <div className="flex items-center gap-4">
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium break-all">{link}</h4>
                            <p className="text-sm text-muted-foreground">
                              외부 링크
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : !showReferenceLinkForm ? (
                  <Card className="p-6 text-center flex flex-col justify-center min-h-[120px]">
                    <p className="text-muted-foreground">
                      등록된 참고링크가 없습니다.
                    </p>
                  </Card>
                ) : null}
                </div>
              </div>

              {/* 첨부파일 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">첨부파일</h3>
                  {user?.isAdmin && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="input-file-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadFileMutation.isPending}
                        data-testid="button-add-file"
                      >
                        {uploadFileMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            업로드 중...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            추가
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {user && !user?.isAdmin && (
                    <span className="text-xs text-muted-foreground">
                      관리자만 업로드 가능합니다.
                    </span>
                  )}
                </div>
                <div>
                {agenda?.referenceFiles && agenda.referenceFiles.length > 0 ? (
                  <div className="space-y-3">
                    {agenda.referenceFiles.map((file, index) => (
                      <Card
                        key={`file-${index}`}
                        className="p-6 hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`card-reference-file-${index}`}
                        onClick={() => window.open(file, "_blank")}
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {file.split("/").pop() || file}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              첨부 파일
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 text-center flex flex-col justify-center min-h-[120px]">
                    <p className="text-muted-foreground">
                      등록된 첨부파일이 없습니다.
                    </p>
                  </Card>
                )}
                </div>
              </div>

              {/* 타 지역 정책 사례 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">타 지역 정책 사례</h3>
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegionalCaseForm(!showRegionalCaseForm)}
                      data-testid="button-add-regional-case"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  )}
                </div>
                <div>
                  {showRegionalCaseForm && (
                    <Card className="p-4 mb-3">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="타 지역 사례를 입력하세요 (예: 서울시 강남구 - 주민참여 예산제 운영)"
                          value={tempRegionalCase}
                          onChange={(e) => setTempRegionalCase(e.target.value)}
                          rows={2}
                          data-testid="input-add-regional-case"
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => {
                              if (tempRegionalCase.trim()) {
                                const currentCases = agenda?.regionalCases || [];
                                updateAgendaMutation.mutate({
                                  regionalCases: [...currentCases, tempRegionalCase.trim()],
                                });
                                setTempRegionalCase("");
                                setShowRegionalCaseForm(false);
                              }
                            }}
                            disabled={!tempRegionalCase.trim() || updateAgendaMutation.isPending}
                            data-testid="button-submit-regional-case"
                          >
                            {updateAgendaMutation.isPending ? "추가 중..." : "추가"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRegionalCaseForm(false);
                              setTempRegionalCase("");
                            }}
                            data-testid="button-cancel-regional-case"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                  {agenda?.regionalCases && agenda.regionalCases.length > 0 ? (
                    <div className="space-y-3">
                      {agenda.regionalCases.map((caseItem, index) => (
                        <Card
                          key={`case-${index}`}
                          className="p-6"
                          data-testid={`card-regional-case-${index}`}
                        >
                          <p className="text-sm">{caseItem}</p>
                        </Card>
                      ))}
                    </div>
                  ) : !showRegionalCaseForm ? (
                    <Card className="p-6 text-center flex flex-col justify-center min-h-[120px]">
                      <p className="text-muted-foreground">
                        등록된 타 지역 정책 사례가 없습니다.
                      </p>
                    </Card>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

