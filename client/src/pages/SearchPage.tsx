import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Loader2, MessageSquare, FileText } from "lucide-react"; // 아이콘 추가
import { useState, useMemo } from "react";
import AgendaCard from "@/components/AgendaCard";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Agenda, Category, Opinion } from "@shared/schema"; // Opinion 타입 추가

// 안건 타입 확장
interface AgendaWithCategory extends Agenda {
  category?: Category;
  bookmarkCount?: number;
  isBookmarked?: boolean;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // 1️⃣ 안건 데이터 가져오기
  const {
    data: allAgendas,
    isLoading: agendasLoading,
  } = useQuery<AgendaWithCategory[]>({
    queryKey: ["/api/agendas"],
  });

  // 2️⃣ 의견 데이터 가져오기 (새로 추가됨!)
  const {
    data: allOpinions,
    isLoading: opinionsLoading,
  } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions"],
  });

  // 로딩 상태 통합
  const isLoading = agendasLoading || opinionsLoading;

  // 3️⃣ 안건 필터링 (제목 기준)
  const filteredAgendas = useMemo(() => {
    if (!searchQuery.trim() || !allAgendas) return [];
    const query = searchQuery.toLowerCase().trim();
    return allAgendas.filter((agenda) =>
      agenda.title.toLowerCase().includes(query)
    );
  }, [searchQuery, allAgendas]);

  // 4️⃣ 의견 필터링 (제목 또는 내용 기준)
  const filteredOpinions = useMemo(() => {
    if (!searchQuery.trim() || !allOpinions) return [];
    const query = searchQuery.toLowerCase().trim();
    return allOpinions.filter((opinion) =>
      // 의견은 제목이 없을 수도 있으니 내용(content)도 같이 검색!
      opinion.content.toLowerCase().includes(query)
    );
  }, [searchQuery, allOpinions]);

  // 검색 결과가 하나라도 있는지 확인
  const hasResults = filteredAgendas.length > 0 || filteredOpinions.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 뒤로 가기 버튼 */}
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>

          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="궁금한 키워드를 검색해보세요 (예: 가로등, 쓰레기)"
              className="pl-10 h-12 rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              data-testid="input-search"
            />
          </div>

          {/* 검색어가 있을 때 결과 표시 */}
          {searchQuery && (
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : hasResults ? (
                <>
                  {/* 🟢 섹션 1: 안건 검색 결과 */}
                  {filteredAgendas.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <FileText className="w-5 h-5 text-blue-500" />
                        관련된 안건 ({filteredAgendas.length})
                      </h3>
                      <div className="space-y-4">
                        {filteredAgendas.map((agenda) => (
                          <AgendaCard
                            key={agenda.id}
                            id={agenda.id}
                            title={agenda.title}
                            category={agenda.category?.name || ""}
                            status={agenda.status}
                            commentCount={agenda.voteCount}
                            bookmarkCount={agenda.bookmarkCount || 0}
                            isBookmarked={agenda.isBookmarked || false}
                            onClick={() => setLocation(`/agendas/${agenda.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 구분선 (둘 다 결과가 있을 때만 표시) */}
                  {filteredAgendas.length > 0 && filteredOpinions.length > 0 && (
                    <hr className="border-t border-gray-200" />
                  )}

                  {/* 🟠 섹션 2: 주민 의견 검색 결과 */}
                  {filteredOpinions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        주민들의 목소리 ({filteredOpinions.length})
                      </h3>
                      <div className="grid gap-3">
                        {filteredOpinions.map((opinion) => (
                          <div
                            key={opinion.id}
                            onClick={() => setLocation(`/opinions/${opinion.id}`)}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
                          >
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {opinion.content}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                              <span>{new Date(opinion.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>👍 {opinion.likes || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // 검색 결과가 아예 없을 때
                <div className="text-center py-20">
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    검색 결과가 없습니다.
                  </p>
                  <p className="text-sm text-gray-500">
                    다른 키워드로 검색해보시겠어요?
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 검색어가 없을 때 초기 화면 */}
          {!searchQuery && (
            <div className="text-center py-20 opacity-50">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                안건이나 의견을 검색해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}