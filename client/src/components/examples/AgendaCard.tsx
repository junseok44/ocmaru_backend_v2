import AgendaCard from "../AgendaCard";

export default function AgendaCardExample() {
  return (
    <div className="p-6 space-y-4">
      <AgendaCard
        id="1"
        title="A초등학교 앞 과속방지턱 설치 요청"
        category="교통"
        status="주민 투표"
        commentCount={45}
        bookmarkCount={23}
        isBookmarked={true}
        onClick={() => console.log("Agenda clicked")}
      />
      <AgendaCard
        id="2"
        title="공원 내 야간 소음 문제 해결 방안"
        category="환경"
        status="검토 중"
        commentCount={89}
        bookmarkCount={56}
        onClick={() => console.log("Agenda clicked")}
      />
    </div>
  );
}
