import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Loader2, Plus, X } from "lucide-react";
import type { Category, Cluster } from "@shared/schema";
import { trackAgendaCreated } from "@/lib/analytics";

export default function NewAgendaForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [okinewsUrl, setOkinewsUrl] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([""]);
  const [regionalCases, setRegionalCases] = useState<string[]>([""]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const lastPrefilledData = useRef<{ clusterId: string | null; title: string; description: string }>({
    clusterId: null,
    title: "",
    description: ""
  });

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlClusterId = searchParams.get('clusterId');
  const urlTitle = searchParams.get('title');
  const urlSummary = searchParams.get('summary');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: clusters = [], isLoading: clustersLoading } = useQuery<Cluster[]>({
    queryKey: ["/api/clusters"],
  });

  const { data: selectedCluster, isLoading: clusterLoading } = useQuery<Cluster>({
    queryKey: ["/api/clusters", urlClusterId],
    enabled: !!urlClusterId && !urlTitle && !urlSummary,
  });

  useEffect(() => {
    const isNewCluster = urlClusterId && lastPrefilledData.current.clusterId !== urlClusterId;
    
    if (urlTitle && urlSummary && isNewCluster) {
      setTitle(urlTitle);
      setDescription(urlSummary);
      setClusterId(urlClusterId);
      lastPrefilledData.current = { clusterId: urlClusterId, title: urlTitle, description: urlSummary };
    } else if (selectedCluster && isNewCluster) {
      setTitle(selectedCluster.title);
      setDescription(selectedCluster.summary);
      setClusterId(selectedCluster.id);
      lastPrefilledData.current = { 
        clusterId: urlClusterId, 
        title: selectedCluster.title, 
        description: selectedCluster.summary 
      };
    }
  }, [search, selectedCluster, urlTitle, urlSummary, urlClusterId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const res = await apiRequest("POST", "/api/agendas", {
        title,
        description,
        categoryId,
        status: "voting",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        okinewsUrl: okinewsUrl || null,
        referenceLinks: referenceLinks.filter(link => link.trim()).length > 0 ? referenceLinks.filter(link => link.trim()) : null,
        regionalCases: regionalCases.filter(caseText => caseText.trim()).length > 0 ? regionalCases.filter(caseText => caseText.trim()) : null,
      });
      const agenda = await res.json();

      if (clusterId && clusterId !== "none") {
        await apiRequest("PATCH", `/api/clusters/${clusterId}`, {
          agendaId: agenda.id,
        });
      }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          await fetch(`/api/agendas/${agenda.id}/files`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
        }
      }

      return agenda;
    },
    onSuccess: (agenda) => {
      // GA 이벤트 추적: 안건 생성
      trackAgendaCreated(agenda.id);
      
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clusters"] });
      toast({
        title: "안건 생성 완료",
        description: "새로운 안건이 성공적으로 생성되었습니다.",
      });
      setLocation("/admin/agendas/all");
    },
    onError: () => {
      toast({
        title: "안건 생성 실패",
        description: "안건 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      toast({
        title: "입력 오류",
        description: "제목, 설명, 카테고리는 필수 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">새 안건 생성</h2>
        <p className="text-muted-foreground">
          새로운 안건을 생성합니다. 투표 기간은 14일로 자동 설정됩니다.
          {urlClusterId && ` (클러스터: ${urlClusterId})`}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                안건 제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="안건 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster">
                클러스터 선택
              </Label>
              {clustersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  클러스터 목록을 불러오는 중...
                </div>
              ) : (
                <Select value={clusterId || "none"} onValueChange={(val) => setClusterId(val === "none" ? "" : val)}>
                  <SelectTrigger data-testid="select-cluster">
                    <SelectValue placeholder="클러스터를 선택하세요 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">클러스터 없이 생성</SelectItem>
                    {clusters
                      .filter(c => !c.agendaId)
                      .map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              {!clustersLoading && clusters.filter(c => !c.agendaId).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  안건화되지 않은 클러스터가 없습니다. 클러스터 없이 생성할 수 있습니다.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                카테고리 <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                안건 설명 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="안건에 대한 상세 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                data-testid="textarea-description"
              />
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold">참고 자료</h3>

              <div className="space-y-2">
                <Label htmlFor="okinews-url">옥천신문 기사</Label>
                <Input
                  id="okinews-url"
                  type="url"
                  placeholder="https://www.okinews.com/..."
                  value={okinewsUrl}
                  onChange={(e) => setOkinewsUrl(e.target.value)}
                  data-testid="input-okinews-url"
                />
              </div>

              <div className="space-y-2">
                <Label>참고링크</Label>
                <div className="space-y-2">
                  {referenceLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="참고링크 URL을 입력하세요"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...referenceLinks];
                          newLinks[index] = e.target.value;
                          setReferenceLinks(newLinks);
                        }}
                        onBlur={() => {
                          // 빈 값이 마지막이 아니면 제거하지 않음
                          if (link.trim() === "" && referenceLinks.length > 1 && index === referenceLinks.length - 1) {
                            setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
                          }
                        }}
                        data-testid={`reference-link-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (referenceLinks.length > 1) {
                            setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
                          } else {
                            setReferenceLinks([""]);
                          }
                        }}
                        data-testid={`button-remove-reference-link-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReferenceLinks([...referenceLinks, ""])}
                    data-testid="button-add-reference-link"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    참고링크 추가
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>타 지역 정책 사례</Label>
                <div className="space-y-2">
                  {regionalCases.map((caseText, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        placeholder="타 지역 사례를 입력하세요 (예: 서울시 강남구 - 주민참여 예산제 운영)"
                        value={caseText}
                        onChange={(e) => {
                          const newCases = [...regionalCases];
                          newCases[index] = e.target.value;
                          setRegionalCases(newCases);
                        }}
                        onBlur={() => {
                          // 빈 값이 마지막이 아니면 제거하지 않음
                          if (caseText.trim() === "" && regionalCases.length > 1 && index === regionalCases.length - 1) {
                            setRegionalCases(regionalCases.filter((_, i) => i !== index));
                          }
                        }}
                        rows={2}
                        data-testid={`regional-case-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (regionalCases.length > 1) {
                            setRegionalCases(regionalCases.filter((_, i) => i !== index));
                          } else {
                            setRegionalCases([""]);
                          }
                        }}
                        data-testid={`button-remove-regional-case-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegionalCases([...regionalCases, ""])}
                    data-testid="button-add-regional-case"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    타 지역 사례 추가
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>첨부파일</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={file.name}
                        readOnly
                        data-testid={`selected-file-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setSelectedFiles([...selectedFiles, ...Array.from(files)]);
                          e.target.value = "";
                        }
                      }}
                      data-testid="input-file"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/agendas")}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "안건 생성"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
