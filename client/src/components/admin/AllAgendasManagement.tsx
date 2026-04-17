import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import type { Agenda, Category } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, Eye, Edit, Trash2, Loader2, Image as ImageIcon, Upload, RefreshCw, X } from "lucide-react";
import { useLocation } from "wouter";

type AgendaStatus = "created" | "voting" | "proposing" | "passed" | "rejected" | "executing" | "executed";

export default function AllAgendasManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // 편집 Dialog 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<AgendaStatus>("created");
  const [editResponse, setEditResponse] = useState("");

  // 이미지 관리 Dialog 상태
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageEditingAgenda, setImageEditingAgenda] = useState<Agenda | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // ✨ [추가] 이미지가 있는 경우 '변경하기'를 눌러야 입력창이 뜨도록 제어
  const [isReplacing, setIsReplacing] = useState(false); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: agendas = [], isLoading } = useQuery<Agenda[]>({
    queryKey: ["/api/agendas"],
  });

  useEffect(() => {
    const statusWithResponse = ["passed", "rejected", "executing", "executed"];
    if (!statusWithResponse.includes(editStatus)) {
      setEditResponse("");
    }
  }, [editStatus]);

  useEffect(() => {
    return () => {
      if (previewUrl && (!imageEditingAgenda?.imageUrl || previewUrl !== imageEditingAgenda.imageUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, imageEditingAgenda]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/agendas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      toast({ title: "안건 삭제 완료", description: "안건이 성공적으로 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "안건 삭제에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string; status?: string; response?: string | null }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/agendas/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      setEditDialogOpen(false);
      toast({ title: "안건 수정 완료", description: "안건이 성공적으로 수정되었습니다." });
    },
    onError: () => {
      toast({ title: "수정 실패", description: "안건 수정에 실패했습니다.", variant: "destructive" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file); 

      const response = await fetch(`/api/agendas/${id}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("이미지 업로드 실패");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendas"] });
      handleCloseImageDialog();
      toast({ title: "이미지 업로드 완료", description: "안건 이미지가 성공적으로 등록되었습니다." });
    },
    onError: () => {
      toast({ title: "업로드 실패", description: "이미지 업로드 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  // --- 이미지 관리 핸들러 수정 ---
  const handleOpenImageDialog = (agenda: Agenda) => {
    setImageEditingAgenda(agenda);
    
    if (agenda.imageUrl) {
        setPreviewUrl(agenda.imageUrl);
        setIsReplacing(false); // 이미지가 있으면 '보기 모드'로 시작
    } else {
        setPreviewUrl(null);
        setIsReplacing(true); // 이미지가 없으면 바로 '업로드 모드'
    }
    
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setImageEditingAgenda(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsReplacing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 기존 objectUrl 해제 (메모리 누수 방지)
      if (previewUrl && previewUrl !== imageEditingAgenda?.imageUrl) {
          URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadImage = () => {
    if (imageEditingAgenda && selectedFile) {
      uploadImageMutation.mutate({ id: imageEditingAgenda.id, file: selectedFile });
    }
  };

  // '사진 변경하기' 버튼 클릭 시
  const handleChangeClick = () => {
    setIsReplacing(true);
  };

  // '변경 취소' 버튼 클릭 시 (원래 이미지로 복구)
  const handleCancelChange = () => {
    setIsReplacing(false);
    setSelectedFile(null);
    if (imageEditingAgenda?.imageUrl) {
      setPreviewUrl(imageEditingAgenda.imageUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  // ---------------------------

  const filteredAgendas = agendas.filter((agenda) => {
    const matchesSearch = agenda.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agenda.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || agenda.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "미지정";
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 이 안건을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (agenda: Agenda) => {
    // 상세 페이지로 이동하면서 관리자용 편집 모달이 자동으로 뜨도록 쿼리 파라미터 전달
    setLocation(`/agendas/${agenda.id}?edit=1`);
  };

  const handleSaveEdit = () => {
    if (!editingAgenda) return;
    
    const updateData: { id: string; title: string; description: string; status: string; response?: string | null } = {
      id: editingAgenda.id,
      title: editTitle,
      description: editDescription,
      status: editStatus,
    };
    
    if (["passed", "rejected", "executing", "executed"].includes(editStatus)) {
      updateData.response = editResponse.trim() || null;
    } else {
      updateData.response = null;
    }
    
    updateMutation.mutate(updateData);
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
          <h2 className="text-2xl font-bold mb-2">전체 안건 관리</h2>
          <p className="text-muted-foreground">
            모든 안건을 조회하고 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button onClick={() => setLocation("/admin/agendas/new")} data-testid="button-create-agenda">
          새 안건 생성
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="안건 제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="created">안건 생성</SelectItem>
              <SelectItem value="voting">투표 중</SelectItem>
              <SelectItem value="proposing">제안 중</SelectItem>
              <SelectItem value="passed">통과</SelectItem>
              <SelectItem value="rejected">반려</SelectItem>
              <SelectItem value="executing">실행 중</SelectItem>
              <SelectItem value="executed">실행 완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40" data-testid="select-category-filter">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filteredAgendas.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "검색 조건에 맞는 안건이 없습니다"
              : "생성된 안건이 없습니다"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>조회수</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgendas.map((agenda) => (
                <TableRow key={agenda.id} data-testid={`agenda-row-${agenda.id}`}>
                  <TableCell className="font-medium max-w-md">
                    <div className="line-clamp-2">{agenda.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryName(agenda.categoryId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(agenda.status)}>
                      {getStatusLabel(agenda.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(agenda.createdAt), "yyyy.MM.dd", { locale: ko })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {agenda.viewCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/agendas/${agenda.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* 🚀 [수정] 이미지가 있으면 파란색 버튼, 없으면 기본 버튼 */}
                      <Button
                        variant={agenda.imageUrl ? "default" : "outline"} // 이미지가 있으면 채워진 버튼
                        size="sm"
                        onClick={() => handleOpenImageDialog(agenda)}
                        className={agenda.imageUrl ? "bg-blue-600 hover:bg-blue-700" : ""}
                        title={agenda.imageUrl ? "사진 변경" : "사진 등록"}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(agenda)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(agenda.id)}
                        disabled={deleteMutation.isPending}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>안건 편집</DialogTitle>
            <DialogDescription>
              안건의 제목, 내용, 상태를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="안건 제목"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="안건 내용"
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <Select value={editStatus} onValueChange={(val) => setEditStatus(val as AgendaStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">안건 생성</SelectItem>
                  <SelectItem value="voting">투표 중</SelectItem>
                  <SelectItem value="proposing">제안 중</SelectItem>
                  <SelectItem value="passed">통과</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                  <SelectItem value="executing">실행 중</SelectItem>
                  <SelectItem value="executed">실행 완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {["passed", "rejected", "executing", "executed"].includes(editStatus) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">답변 및 결과</label>
                <Textarea
                  value={editResponse}
                  onChange={(e) => setEditResponse(e.target.value)}
                  placeholder="안건에 대한 답변 및 결과를 입력하세요."
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editTitle.trim() || !editDescription.trim()}
            >
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 🚀 [수정] 이미지 관리 Dialog --- */}
      <Dialog open={imageDialogOpen} onOpenChange={handleCloseImageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {imageEditingAgenda?.imageUrl ? "안건 사진 관리" : "안건 사진 등록"}
            </DialogTitle>
            <DialogDescription>
              {imageEditingAgenda?.imageUrl 
                ? "현재 등록된 사진을 확인하거나 변경할 수 있습니다." 
                : "안건에 표시될 대표 이미지를 업로드합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              
              {/* 1. 이미지 미리보기 영역 */}
              <div className="relative w-full h-56 bg-muted rounded-lg overflow-hidden flex items-center justify-center border shadow-sm group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="안건 이미지 미리보기"
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center p-6 text-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">등록된 이미지가 없습니다</p>
                    <p className="text-xs text-gray-400 mt-1">아래에서 사진을 등록해주세요</p>
                  </div>
                )}
              </div>
              
              {/* 2. 상태에 따른 버튼/입력창 표시 */}
              {/* 이미지가 있고 + 아직 변경 버튼을 안 눌렀다면 -> [사진 변경하기] 버튼 표시 */}
              {!isReplacing && imageEditingAgenda?.imageUrl ? (
                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-2 h-12"
                  onClick={handleChangeClick}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> 사진 변경하기
                </Button>
              ) : (
                /* 이미지가 없거나 + 변경 모드라면 -> 파일 입력창 표시 */
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="picture" className="text-sm font-medium">
                      새로운 사진 선택
                    </Label>
                    {/* 변경 취소 버튼 (원래 이미지가 있었던 경우에만) */}
                    {isReplacing && imageEditingAgenda?.imageUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500"
                        onClick={handleCancelChange}
                      >
                        <X className="w-3 h-3 mr-1" /> 변경 취소
                      </Button>
                    )}
                  </div>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    * 5MB 이하의 JPG, PNG 파일을 권장합니다.
                  </p>
                </div>
              )}

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImageDialog}>
              닫기
            </Button>
            {/* 업로드 버튼은 '파일이 선택되었을 때'만 활성화 */}
            <Button
              onClick={handleUploadImage}
              disabled={!selectedFile || uploadImageMutation.isPending}
              className={selectedFile ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {uploadImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {imageEditingAgenda?.imageUrl ? "변경사항 저장" : "사진 업로드"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}