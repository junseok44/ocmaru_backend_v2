import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  trend?: number;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6" data-testid="card-stat">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground" data-testid="text-label">{label}</p>
          <p className="text-4xl font-bold" data-testid="text-value">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trend > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-chart-2" />
                  <span className="text-chart-2">+{trend}%</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-destructive">{trend}%</span>
                </>
              ) : (
                <span className="text-muted-foreground">0%</span>
              )}
            </div>
          )}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </Card>
  );
}
