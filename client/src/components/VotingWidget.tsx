import { Progress } from "@/components/ui/progress";

interface VotingWidgetProps {
  agreeCount: number;
  neutralCount: number;
  disagreeCount: number;
  userVote?: "agree" | "neutral" | "disagree";
  onVote?: (vote: "agree" | "neutral" | "disagree" | null) => void;
  disabled?: boolean;
  status?: string; // 👈 새로 추가됨: 현재 안건의 상태 (voting, executed 등)
}

export default function VotingWidget({
  agreeCount,
  neutralCount,
  disagreeCount,
  userVote,
  onVote,
  disabled = false,
  status = "voting", // 기본값은 투표중
}: VotingWidgetProps) {
  // 상태가 'voting'일 때만 투표 가능
  const isVoting = status === "voting";
  
  const total = agreeCount + neutralCount + disagreeCount;
  const agreePercent = total > 0 ? (agreeCount / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutralCount / total) * 100 : 0;
  const disagreePercent = total > 0 ? (disagreeCount / total) * 100 : 0;

  const handleVote = (vote: "agree" | "neutral" | "disagree") => {
    if (disabled || !isVoting) return; // 투표 중 아니면 클릭 막음
    
    if (userVote === vote) {
      onVote?.(null);
      console.log("Vote cancelled");
    } else {
      onVote?.(vote);
      console.log("Voted:", vote);
    }
  };

  // 결과 그래프를 보여줄지 결정하는 변수 (투표했거나 OR 투표가 끝났으면 보여줌)
  const showResults = userVote || !isVoting;

  return (
    <div className="space-y-4 p-5 bg-ok_gray1 rounded-2xl border border-gray-100 shadow-sm" data-testid="widget-voting">
      {/* 1. 헤더 부분: 상태에 따라 텍스트 변경 */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800">
          {isVoting ? "투표하기" : "투표 결과"}
        </h2>
        {!isVoting && (
           <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
             {status === 'executed' ? '실현됨 🎉' : '투표 종료'}
           </span>
        )}
      </div>

      {/* 2. 버튼 섹션: 투표 중일 때만 보임 (isVoting === true) */}
      {isVoting && (
        <div className="w-full h-16 flex items-center gap-2">
          {/* 찬성 버튼 */}
          <div
            className={`flex-1 h-full px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-ok_gray2 rounded-xl flex flex-row items-center justify-center gap-2 ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-neutral-100 active:scale-95 transition-all"
            } ${userVote === "agree" ? "ring-2 ring-green-600 bg-green-50 border-green-200" : ""}`}
            onClick={() => handleVote("agree")}
          >
            <div className={`w-3 h-3 rounded-full ${userVote === 'agree' ? 'bg-green-600' : 'bg-green-600'}`}></div>
            <div className={`text-sm font-bold ${userVote === 'agree' ? 'text-green-700' : 'text-gray-500'}`}>
              찬성
            </div>
          </div>

          {/* 중립 버튼 */}
          <div
            className={`flex-1 h-full px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-ok_gray2 rounded-xl flex flex-row items-center justify-center gap-2 ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-neutral-100 active:scale-95 transition-all"
            } ${userVote === "neutral" ? "ring-2 ring-amber-500 bg-amber-50 border-amber-200" : ""}`}
            onClick={() => handleVote("neutral")}
          >
            <div className={`w-3 h-1 rounded-full ${userVote === 'neutral' ? 'bg-amber-500' : 'bg-amber-500'}`}></div>
            <div className={`text-sm font-bold ${userVote === 'neutral' ? 'text-amber-600' : 'text-gray-500'}`}>
              중립
            </div>
          </div>

          {/* 반대 버튼 */}
          <div
            className={`flex-1 h-full px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-ok_gray2 rounded-xl flex flex-row items-center justify-center gap-2 ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-neutral-100 active:scale-95 transition-all"
            } ${userVote === "disagree" ? "ring-2 ring-rose-500 bg-rose-50 border-rose-200" : ""}`}
            onClick={() => handleVote("disagree")}
          >
            <div className="relative w-3 h-3">
               <div className={`absolute inset-0 m-auto w-full h-0.5 rotate-45 ${userVote === 'disagree' ? 'bg-rose-500' : 'bg-rose-500'}`}></div>
               <div className={`absolute inset-0 m-auto w-full h-0.5 -rotate-45 ${userVote === 'disagree' ? 'bg-rose-500' : 'bg-rose-500'}`}></div>
            </div>
            <div className={`text-sm font-bold ${userVote === 'disagree' ? 'text-rose-600' : 'text-gray-500'}`}>
              반대
            </div>
          </div>
        </div>
      )}

      {/* 3. 결과 그래프 섹션: 투표했거나(userVote) OR 투표가 끝났으면(!isVoting) 보임 */}
      {showResults && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
          {!isVoting && (
             <p className="text-sm text-gray-500 mb-4">
               총 <span className="font-bold text-gray-900">{total.toLocaleString()}명</span>이 참여했습니다.
             </p>
          )}

          {/* 찬성 그래프 */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-green-700 flex items-center gap-1">
                찬성 
                {userVote === 'agree' && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">나의 투표</span>}
              </span>
              <span className="text-gray-600">{Math.round(agreePercent)}% ({agreeCount})</span>
            </div>
            <Progress value={agreePercent} className="h-2.5 bg-gray-100" indicatorClassName="bg-green-600" />
          </div>

          {/* 중립 그래프 */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-amber-600 flex items-center gap-1">
                중립
                {userVote === 'neutral' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded">나의 투표</span>}
              </span>
              <span className="text-gray-600">{Math.round(neutralPercent)}% ({neutralCount})</span>
            </div>
            <Progress value={neutralPercent} className="h-2.5 bg-gray-100" indicatorClassName="bg-amber-400" />
          </div>

          {/* 반대 그래프 */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
               <span className="text-rose-600 flex items-center gap-1">
                반대
                {userVote === 'disagree' && <span className="text-[10px] bg-rose-100 text-rose-700 px-1 rounded">나의 투표</span>}
               </span>
              <span className="text-gray-600">{Math.round(disagreePercent)}% ({disagreeCount})</span>
            </div>
            <Progress value={disagreePercent} className="h-2.5 bg-gray-100" indicatorClassName="bg-rose-500" />
          </div>
        </div>
      )}
    </div>
  );
}