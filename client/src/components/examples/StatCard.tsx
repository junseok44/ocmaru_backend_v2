import StatCard from "../StatCard";
import { MessageSquare } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="신규 의견" value={142} trend={12} icon={<MessageSquare className="w-8 h-8" />} />
      <StatCard label="활발한 안건" value={23} trend={-5} />
      <StatCard label="투표 참여자" value={1856} trend={8} />
      <StatCard label="신규 가입자" value={67} trend={0} />
    </div>
  );
}
