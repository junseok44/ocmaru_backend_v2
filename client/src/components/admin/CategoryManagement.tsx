import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import type { Category, Agenda } from "@shared/schema";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function CategoryManagement() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: agendas = [], isLoading: agendasLoading } = useQuery<Agenda[]>({
    queryKey: ["/api/agendas"],
  });

  const getAgendaCount = (categoryId: string) => {
    return agendas.filter((agenda) => agenda.categoryId === categoryId).length;
  };

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  const filteredAgendas = useMemo(() => {
    if (!selectedCategoryId) return [];
    return agendas.filter((agenda) => agenda.categoryId === selectedCategoryId);
  }, [agendas, selectedCategoryId]);

  const totalPages = Math.ceil(filteredAgendas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAgendas = filteredAgendas.slice(startIndex, endIndex);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handleBackClick = () => {
    setSelectedCategoryId(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (categoriesLoading || agendasLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 카테고리 안건 목록 보기 모드
  if (selectedCategoryId && selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              뒤로가기
            </Button>
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedCategory.name} 안건 목록</h2>
              <p className="text-muted-foreground">
                총 {filteredAgendas.length}개의 안건이 있습니다
              </p>
            </div>
          </div>
        </div>

        {filteredAgendas.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">이 카테고리에 등록된 안건이 없습니다</p>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgendas.map((agenda) => (
                    <TableRow
                      key={agenda.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/agendas/${agenda.id}`)}
                    >
                      <TableCell className="font-medium max-w-md">
                        <div className="line-clamp-2">{agenda.title}</div>
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/agendas/${agenda.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    );
  }

  // 카테고리 목록 보기 모드
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">카테고리 관리</h2>
          <p className="text-muted-foreground">
            안건 카테고리 목록을 확인합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="p-6 hover-elevate active-elevate-2 cursor-pointer"
            onClick={() => handleCategoryClick(category.id)}
            data-testid={`category-${category.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description || "카테고리 설명 없음"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{getAgendaCount(category.id)}개 안건</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">등록된 카테고리가 없습니다</p>
        </Card>
      )}
    </div>
  );
}
