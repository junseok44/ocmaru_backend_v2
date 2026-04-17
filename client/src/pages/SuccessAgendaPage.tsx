import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import VotingWidget from "@/components/VotingWidget";
import Timeline from "@/components/Timeline";
import { getStatusBadgeClass } from "@/lib/utils";

export default function SuccessAgendaPage() {
  const sampleAgenda = {
    title: "안남면에 의료시설 필요합니다",
    description: `안남면에는 고령 인구 비중이 높아 갑작스러운 위기 상황에 신속히 대응할 기반이 필요합니다. 현재 인근 지역으로 이동해야 하는 의료 공백이 커서 치료 시기가 늦어지는 문제가 생기고 있어요.

만성질환 관리, 응급 처치, 기본 검사 같은 일상적 의료 서비스 접근성도 낮아요. 생활 인프라의 핵심인 의료 시설이 필수적입니다.`,
    category: "보건",
    status: "passed" as const,
    createdDate: "2024.10.15",
    okinewsUrl: "https://www.okinews.com/news/articleView.html?idxno=12345",
    referenceLinks: [
      "https://www.mohw.go.kr/react/policy/index.jsp",
      "https://www.longtermcare.or.kr/",
    ],
    referenceFiles: [
      "/files/medical-facility-plan.pdf",
      "/files/budget-proposal.pdf",
    ],
    regionalCases: [
      "충북 보은군 - 면 단위 보건지소 확대 운영으로 주민 만족도 85% 상승",
      "경북 영양군 - 순회 진료 시스템 구축으로 의료 접근성 개선",
    ],
    voteStats: {
      total: 487,
      agree: 412,
      disagree: 45,
      neutral: 30,
    },
  };

  const timelineSteps = [
    {
      label: "안건 생성",
      status: "completed" as const,
      date: sampleAgenda.createdDate,
    },
    {
      label: "투표중",
      status: "completed" as const,
    },
    {
      label: "검토중",
      status: "completed" as const,
    },
    {
      label: "통과",
      status: "current" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-24 md:pb-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{sampleAgenda.category}</Badge>
              <Badge className={getStatusBadgeClass(sampleAgenda.status)}>
                통과
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4">{sampleAgenda.title}</h1>
            <p className="text-muted-foreground whitespace-pre-line">
              {sampleAgenda.description}
            </p>
          </div>

          <Tabs defaultValue="vote" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vote">투표</TabsTrigger>
              <TabsTrigger value="opinions">의견</TabsTrigger>
              <TabsTrigger value="references">참고자료</TabsTrigger>
            </TabsList>

            <TabsContent value="vote" className="space-y-6 mt-6">
              <VotingWidget
                agreeCount={sampleAgenda.voteStats.agree}
                disagreeCount={sampleAgenda.voteStats.disagree}
                neutralCount={sampleAgenda.voteStats.neutral}
                userVote="agree"
                onVote={() => {}}
                disabled={true}
              />

              <Timeline steps={timelineSteps} />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">답변 및 결과</h2>
                <Card className="p-6">
                  <p className="text-lg font-semibold mb-2">옥천군수</p>
                  <p className="text-base">
                    안남면의 의료 필요성에 대해 공감합니다. 예산 300억원으로
                    필수 의료 시설을 건립하도록 합시다.
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      완공 예정일: 2026.04.28.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      장소: 안남면사무소 옆
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="opinions" className="mt-6">
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  의견 기능은 데모 페이지에서 제공되지 않습니다.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="references" className="space-y-6 mt-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">옥천신문</h3>
                <Card
                  className="p-6 hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => window.open(sampleAgenda.okinewsUrl, "_blank")}
                  data-testid="card-okinews-link"
                >
                  <div className="flex items-center gap-4">
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium break-all">
                        {sampleAgenda.okinewsUrl}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        옥천신문 기사
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">참고링크</h3>
                {sampleAgenda.referenceLinks.map((link, index) => (
                  <Card
                    key={`link-${index}`}
                    className="p-6 hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => window.open(link, "_blank")}
                    data-testid={`card-reference-link-${index}`}
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

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">첨부파일</h3>
                {sampleAgenda.referenceFiles.map((file, index) => (
                  <Card
                    key={`file-${index}`}
                    className="p-6 hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => window.open(file, "_blank")}
                    data-testid={`card-reference-file-${index}`}
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

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">타 지역 정책 사례</h3>
                {sampleAgenda.regionalCases.map((caseItem, index) => (
                  <Card
                    key={`case-${index}`}
                    className="p-6"
                    data-testid={`card-regional-case-${index}`}
                  >
                    <p className="text-sm">{caseItem}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
