import Header from "@/components/Header";
import TitleCard from "@/components/TitleCard";
import { ArrowRight, ArrowDown } from "lucide-react";

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <TitleCard
          title="두런두런 옥천마루 이용 방법"
          description="작은 씨앗이 거대한 나무가 되기까지의 여정"
        />
        {/* 2. [핵심] 성장 과정 다이어그램 (그림 대신 코드로 구현) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-20">
          
          {/* 단계 1: 씨앗 (주민의견) */}
          <StepCard 
            icon={<img src="/icons/seed.png" alt="씨앗" className="w-16 h-16 object-contain" />}
            title="주민의 목소리"
            subtitle="씨앗"
            color="bg-ok_sand"
            description="우리 마을에 필요한 것이 있나요? 여러분의 생각을 자유롭게 남겨주세요. 다른 이웃의 의견에도 좋아요와 답글로 반응할 수 있습니다."
          />

          {/* 화살표 (모바일: 아래 / PC: 오른쪽) */}
          <ArrowIcon />

          {/* 단계 2: 새싹 (안건) */}
          <StepCard 
            icon={<img src="/icons/sprout.png" alt="새싹" className="w-16 h-16 object-contain" />}
            title="안건 보기"
            subtitle="새싹"
            color="bg-ok_sand"
            description="비슷한 목소리가 많이 모이면, 관리자가 안건으로 채택하게 됩니다. 투표에 참여하고, 댓글을 달아 안건의 힘을 키워주세요. 여러분의 관심도는 정책 제안의 기반이 됩니다."
          />

          {/* 화살표 */}
          <ArrowIcon />

          {/* 단계 3: 나무 (정책) */}
          <StepCard 
            icon={<img src="/icons/tree.png" alt="나무" className="w-16 h-16 object-contain" />}
            title="정책 실현"
            subtitle="나무"
            color="bg-ok_sand"
            description="2주간의 투표 결과 및 다양한 참고자료를 토대로 다듬어진 정책은 관리자가 지자체에 제안하게 됩니다. 주무부처의 공식 답변을 직접 조회할 수 있습니다."
          />

        </div>

        {/* 3. 상세 설명 (텍스트 박스) */}
        <div className="bg-ok_gray2 rounded-[40px] p-8 md:p-12 text-center border border-gray-100">
          <h3 className="text-xl font-bold text_ok_txtgray2 mb-4">함께 키우는 숲 🌳</h3>
          <p className="text-ok_txtgray2 leading-relaxed max-w-2xl mx-auto">
            두런두런 옥천마루는 여러분의 참여로 자라납니다.<br />
            나 혼자만의 불평이 아닌, <strong>우리 모두의 해결책</strong>이 되는 과정.<br />
            지금 바로 여러분만의 씨앗을 심어보세요!
          </p>
        </div>

      </main>
    </div>
  );
}

// 🧩 내부 컴포넌트: 단계별 카드 (동그라미 + 텍스트)
function StepCard({ icon, title, subtitle, color, description }: any) {
  return (
    <div className="flex flex-col items-center text-center max-w-[280px] group">
      {/* 동그라미 아이콘 영역 */}
      <div className={`w-32 h-32 ${color} rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      {/* 텍스트 영역 */}
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{title}</h3>
      <span className="text-sm font-bold text-ok_sandtxt mb-3 block">{subtitle}</span>
      <p className="text-ok_txtgray1 text-sm leading-keep word-break-keep">
        {description}
      </p>
    </div>
  );
}

// 🧩 내부 컴포넌트: 반응형 화살표
function ArrowIcon() {
  return (
    <div className="text-gray-300 my-4 md:my-0">
      <ArrowRight className="hidden md:block w-8 h-8" /> {/* PC용 */}
      <ArrowDown className="md:hidden w-8 h-8" />      {/* 모바일용 */}
    </div>
  );
}