import Timeline from "../Timeline";

export default function TimelineExample() {
  const steps = [
    { label: "의견 접수", status: "completed" as const, date: "2024.01.15" },
    { label: "안건 작성", status: "completed" as const, date: "2024.02.01" },
    { label: "주민 투표", status: "current" as const },
    { label: "검토 중", status: "upcoming" as const },
    { label: "답변 및 결과", status: "upcoming" as const },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <Timeline steps={steps} />
    </div>
  );
}
