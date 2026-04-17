import { useLocation } from "wouter";
import Header from "@/components/Header";
import { ArrowRight, MessageSquare, Loader2, HelpCircle, Heart, X } from "lucide-react";
import type { Opinion, Agenda, Category } from "@shared/schema";
import { useQuery, useQueries } from "@tanstack/react-query";
import { authFetch, normalizeApiResponse } from "@/lib/queryClient";
import HomeAgendaCard from "@/components/HomeAgendaCard";
import { useMemo, useState, useEffect } from "react";
import PolicyCard from "@/components/PolicyCard";
import HomeOpinionCard from "@/components/HomeOpinionCard";

// 타임라인 아이템 타입 정의
interface ExecutionTimelineItem {
  id: string;
  authorName: string;
  createdAt: string;
}

type HomeAgendaData = Agenda & {
  status: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  imageUrl?: string | null;
  response?: unknown;
  category: Category | null;
  bookmarkCount: number;
  isBookmarked: boolean;
};

export default function HomePage() {
  const [, setLocation] = useLocation();

  // 0️⃣ 배너 상태 관리
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const isHidden = localStorage.getItem("hide-guide-banner");
    if (isHidden === "true") {
      setShowBanner(false);
    }
  }, []);

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    localStorage.setItem("hide-guide-banner", "true");
  };

  // 🤍 의견 데이터 가져오기
  const { data: opinions, isLoading: isOpinionsLoading } = useQuery<Opinion[]>({
    queryKey: ["/api/opinions", "preview"],
    queryFn: async () => {
      const url = "/api/opinions?limit=10";
      const response = await authFetch(url);
      if (!response.ok) throw new Error("Failed to fetch opinions");
      return normalizeApiResponse(url, await response.json());
    },
  });

  const recentOpinions = opinions ? [...opinions].slice(0, 10) : [];

  // 🤍 안건 데이터 가져오기
  const { data: agendas, isLoading: isAgendasLoading } = useQuery<HomeAgendaData[]>({
    queryKey: ["/api/agendas", "home-spotlight"],
    queryFn: async () => {
      const url = "/api/agendas";
      const response = await authFetch(url);
      if (!response.ok) throw new Error("Failed to fetch agendas");
      return normalizeApiResponse(url, await response.json()) as HomeAgendaData[];
    },
  });

  // 🤍 정책 실현 데이터 필터링 (executed, executing만 filter, 최신순 정렬됨)
  const realizedPolicies = useMemo(() => {
    if (!agendas) return [];
    return agendas
      .filter((a) => ["executed", "executing"].includes(a.status ?? ""))
      .sort((a, b) => new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime())
      .slice(0, 5);
  }, [agendas]);

  // 4️⃣ 각 정책의 타임라인(작성자 정보) 가져오기
  const timelineQueries = useQueries({
    queries: realizedPolicies.map((policy) => ({
      queryKey: [`/api/agendas/${policy.id}/execution-timeline`],
      queryFn: async () => {
        const res = await fetch(`/api/agendas/${policy.id}/execution-timeline`);
        if (!res.ok) throw new Error("Failed to fetch timeline");
        return res.json() as Promise<ExecutionTimelineItem[]>;
      },
      enabled: !!policy.id,
    })),
  });

  // 5️⃣ 안건 정보 + 타임라인 정보(작성자) 합치기
  const policiesWithAuthor = useMemo(() => {
    return realizedPolicies.map((policy, index) => {
      const timelineData = timelineQueries[index]?.data;
      let latestAuthor = "옥천군청";

      if (timelineData && timelineData.length > 0) {
        const sorted = [...timelineData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        latestAuthor = sorted[0].authorName;
      }

      return {
        ...policy,
        agency: latestAuthor
      };
    });
  }, [realizedPolicies, timelineQueries]);

  // 랜덤 스포트라이트 로직
  const spotlightData = useMemo(() => {
    if (!agendas || agendas.length === 0) {
      return { title: "등록된 안건이 없어요.", data: [] };
    }

    const groups = [
      {
        status: 'voting',
        title: "지금 투표가 진행 중인 안건입니다.\n소중한 한 표를 행사해주세요!",
        data: agendas.filter((a) => a.status === "voting")
      },
      {
        status: 'proposing',
        title: "담당 기관에 정책 제안을 진행 중인 안건들입니다. \n 답변을 기다리고 있어요.",
        data: agendas.filter((a) => a.status === "proposing")
      },
      {
        status: 'executing',
        title: "우리 마을이 바뀌고 있어요.\n현재 실행 중인 안건들입니다.",
        data: agendas.filter((a) => a.status === "executing")
      },
      {
        status: 'completed',
        title: "우리가 함께 만들어낸 변화입니다.\n해결된 안건들을 확인해보세요.",
        data: agendas.filter((a) => ["passed", "executed", "rejected"].includes(a.status ?? ""))
      }
    ];

    const validGroups = groups.filter(g => g.data.length > 0);

    if (validGroups.length === 0) {
      return {
        title: "최근 등록된 안건들입니다.\n어떤 이야기들이 있는지 확인해보세요 👀",
        data: [...agendas].sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime()).slice(0, 5)
      };
    }

    const randomIndex = Math.floor(Math.random() * validGroups.length);
    return validGroups[randomIndex];

  }, [agendas]);

  const { title: boxDescription, data: spotlightAgendas } = spotlightData;

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <Header />

      {/* 이용안내 배너 */}
      {showBanner && (
        <div
          onClick={() => setLocation("/howto")}
          className="w-[98vw] mx-auto mt-4 rounded-2xl bg-ok_sand text-ok_sandtxt py-3 px-4 flex items-center justify-center cursor-pointer hover:bg-ok_sandhover transition-colors text-sm md:text-base font-medium animate-in slide-in-from-top duration-300 relative"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <span>옥천마루에 처음 오셨나요? 이용 안내 보러가기</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <button
            onClick={handleCloseBanner}
            className="absolute right-4 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-4 h-4 text-ok_sandtxt" />
          </button>
        </div>
      )}

      <main className="w-full mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1 text-center">

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 💙 [사이드 박스 - 안건 보기] (높이의 기준 / Master) */}
          <div className="lg:col-span-2 bg-primary rounded-[40px] p-8 md:p-12 flex flex-col min-h-[400px] relative overflow-hidden">
            <div className="text-left mb-6 relative z-10">
              <div className="flex justify-between items-start">
                <h2 className="text-4xl font-extrabold text-ok_gray1 mb-2">
                  안건 보기
                </h2>
                <div
                  onClick={() => setLocation("/agendas")}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-sm shrink-0"
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-ok_gray1 whitespace-pre-wrap leading-relaxed text-m">
                {boxDescription}
              </p>
            </div>

            <div className="flex-1 w-full flex items-end">
              {isAgendasLoading ? (
                <div className="w-full h-40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : spotlightAgendas.length > 0 ? (
                <div className="flex gap-3 md:gap-5 overflow-x-auto pb-4 -mx-4 px-2 scrollbar-hide snap-x font-sans w-full">
                  {spotlightAgendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className="shrink-0 snap-center w-[250px] md:w-[260px] h-auto"
                    >
                      <HomeAgendaCard
                        title={agenda.title}
                        description={agenda.description}
                        imageUrl={agenda.imageUrl}
                        category={agenda.category?.name || "기타"}
                        categoryIcon={agenda.category?.icon}
                        status={agenda.status}
                        onClick={() => setLocation(`/agendas/${agenda.id}`)}
                        bookmarkCount={agenda.bookmarkCount || 0}
                        isBookmarked={agenda.isBookmarked}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full bg-white/50 rounded-2xl p-6 text-gray-500 text-sm">
                  표시할 안건이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 💙 [메인 박스 - 정책 실현 현황] (Slave) */}
          <div className="lg:col-span-1 relative md:min-h-[450px] lg:min-h-0">
            {/* 👇 수정 포인트 1: h-[500px]로 모바일 높이 강제 고정 (원하는 높이로 조절해!) */}
            {/* 👇 수정 포인트 2: md: h-full -> md:h-full (띄어쓰기 삭제) */}
            <div className="bg-ok_gray2 rounded-[40px] w-full h-[500px] md:h-full lg:absolute lg:inset-0 overflow-hidden flex flex-col gap-6 p-8 md:p-12 pt-10 pb-10">

              {/* 주민의 목소리 header 부분 */}
              <div className="w-full text-left shrink-0"> {/* shrink-0 추가: 헤더는 절대 찌그러지지 않게 */}
                <h2 className="text-3xl font-extrabold text-ok_txtgray2 mb-2">
                  주민의 목소리
                </h2>
                <p className="text-ok_txtgray1">
                  우리 동네에 필요한 점을<br />자유롭게 이야기해주세요.
                </p>
                <button
                  onClick={() => setLocation("/opinions")}
                  className="text-sm font-bold text-ok_txtgray2 underline underline-offset-4 hover:text-ok_sub1"
                >
                  전체보기 &rarr;
                </button>
              </div>

              {/* 주민의 목소리 content */}
              {/* 👇 중요: flex-1 min-h-0 추가 -> 남은 공간을 모두 차지하면서 내부 스크롤 활성화 */}
              <div className="flex-1 min-h-0 w-full overflow-y-auto pb-4 scrollbar-hide">
                {isOpinionsLoading ? (
                  <div className="flex items-center justify-center h-40 w-full text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    주민 의견을 불러오는 중입니다...🌱
                  </div>
                ) : recentOpinions.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {recentOpinions.map((opinion) => (
                      <HomeOpinionCard
                        key={String(opinion.id)}
                        opinion={{
                          id: String(opinion.id),
                          content: opinion.content,
                          createdAt: String(opinion.createdAt ?? new Date().toISOString()),
                          likes: Number(opinion.likes ?? 0),
                        }}
                        onClick={() => setLocation(`/opinion/${String(opinion.id)}`)}
                      />
                    ))}
                    <div
                      onClick={() => setLocation("/opinions")}
                      className="min-w-[100px] flex items-center justify-center bg-gray-50 rounded-3xl cursor-pointer hover:bg-gray-100 text-gray-400 font-bold text-sm py-4"
                    >
                      더보기 +
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 w-full bg-gray-50 rounded-3xl text-gray-400">
                    아직 등록된 의견이 없습니다. 😅
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 💙 [하단 박스] 주민 의견 */}
          <div className="lg:col-span-3 bg-ok_gray2 rounded-[40px] p-8 md:p-12 flex flex-col lg:flex-row justify-start gap-8 min-h-[250px] overflow-hidden">
            {/* ▲ flex-col lg:flex-row 추가: 모바일엔 위아래, PC엔 좌우 배치 */}

            {/* 정책 헤더 */}
            <div className="flex flex-col justify-between items-start w-full lg:w-[30%] shrink-0 z-10 text-left gap-4">
              {/* ▲ w-span-1 삭제하고 lg:w-[30%]로 변경. shrink-0은 찌그러짐 방지 */}
              <div>
                <h2 className="text-3xl md:text-3xl font-bold tracking-tighter text-gray-900 mb-2 leading-tight">
                  함께 피우는 정책
                </h2>
                <p className="text-sm md:text-base text-gray-500">
                  주민들의 소중한 의견이 모여 실제 변화를 만들어낸 기록입니다.
                </p>
              </div>

              <button
                onClick={() => setLocation("/policy")}
                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm md:text-base flex items-center gap-2 hover:bg-ok_sub1 transition-colors shadow-md hover:shadow-lg shrink-0"
              >
                전체보기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 정책 리스트 content */}
            <div className="w-full flex-1 overflow-x-auto scrollbar-hide">
              {/* ▲ w-span-2 삭제하고 flex-1 (남은 공간 다 차지해라) 추가 */}

              {policiesWithAuthor.length > 0 ? (
                <div className="flex gap-4 w-[150vw] lg:w-[65vw] pb-2">
                  {policiesWithAuthor.map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      title={policy.title}
                        content={(typeof policy.response === "string" ? policy.response : "") || policy.description}
                      agency={policy.agency}
                        date={new Date(policy.updatedAt ?? "").toLocaleDateString()}
                      onClick={() => setLocation(`/agendas/${policy.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-white/50 p-6 text-gray-400">
                  <p className="text-lg font-bold mb-1">아직 실현된 정책이 없어요</p>
                  <p className="text-xs">여러분의 의견으로 첫 번째 변화를 만들어주세요!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Tech for Impact / Kakao Impact 보증 푸터 (참고 가이드 스타일) */}
      <footer className="w-full border-t border-gray-100/80 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col items-center justify-center gap-2 text-[10px] md:text-[11px] text-gray-400">
          {/* 합쳐진 kakao | TECH FOR IMPACT 로고 */}
          <a
            href="https://techforimpact.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center"
            aria-label="Tech for Impact 홈페이지로 이동"
          >
            <img
              src="/logo.png"
              alt="kakao | TECH FOR IMPACT"
              className="h-4 md:h-5 object-contain"
            />
          </a>

          <p className="leading-relaxed text-center">
            본 서비스는 카카오임팩트 재단의 지원과 테크포임팩트 커뮤니티의 기여로 개발되었습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}