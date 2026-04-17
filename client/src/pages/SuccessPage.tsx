import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PartyPopper } from "lucide-react";

export default function SuccessPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 pb-24 md:pb-8">
        <Card
          className="p-8 hover-elevate active-elevate-2 cursor-pointer bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
          onClick={() => setLocation("/success/agenda")}
          data-testid="card-success-banner"
        >
          <div className="flex items-start gap-4">
            <PartyPopper className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                당신의 투표로 우리 동네에 병원이 생길 예정입니다! 축하드립니다
              </h1>
              <div className="space-y-1 text-lg">
                <p className="font-semibold">
                  완공 예정일: <span className="text-primary">2026.04.28.</span>
                </p>
                <p className="font-semibold">
                  장소: <span className="text-primary">안남면사무소 옆</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                클릭하여 관련 안건 보기
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            주민 여러분의 적극적인 참여로 실현된 정책입니다.
          </p>
          <Button variant="outline" onClick={() => setLocation("/agendas")}>
            다른 안건 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
