import { Check } from "lucide-react";

interface TimelineStep {
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export default function Timeline({ steps }: TimelineProps) {
  return (
    <div className="space-y-4" data-testid="timeline">
      <h2 className="text-xl font-semibold mb-12">진행상황</h2>
      
      {/* 모바일: 세로 레이아웃 */}
      <div className="space-y-4 md:hidden">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4" data-testid={`timeline-step-${index}`}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.status === "completed"
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.status === "current"
                    ? "border-primary bg-background"
                    : "border-muted-foreground/25 bg-background"
                }`}
              >
                {step.status === "completed" && <Check className="w-4 h-4" />}
                {step.status === "current" && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    step.status === "completed" ? "bg-primary" : "bg-muted-foreground/25"
                  }`}
                ></div>
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={`font-medium ${
                  step.status === "upcoming" ? "text-muted-foreground/80" : ""
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-sm text-muted-foreground">{step.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PC: 가로 레이아웃 */}
      <div className="hidden md:block md:relative md:pb-8">
        <div className="flex items-start justify-between relative">
          {/* 연결선 (배경) */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted"></div>
          {steps.map((step, index) => {
            if (index < steps.length - 1) {
              const isCompleted = step.status === "completed";
              return (
                <div
                  key={`line-${index}`}
                  className={`absolute top-4 h-0.5 ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                  style={{
                    left: `${(index + 0.5) * (100 / steps.length)}%`,
                    width: `${100 / steps.length}%`,
                  }}
                ></div>
              );
            }
            return null;
          })}
          
          {/* 스텝들 */}
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center flex-1 relative z-10"
              data-testid={`timeline-step-${index}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.status === "completed"
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.status === "current"
                    ? "border-primary bg-background"
                    : "border-muted-foreground/25 bg-background"
                }`}
              >
                {step.status === "completed" && <Check className="w-4 h-4" />}
                {step.status === "current" && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
              <div className="mt-4 text-center max-w-[120px]">
                <p
                  className={`font-medium text-sm ${
                    step.status === "upcoming" ? "text-muted-foreground/80" : ""
                  }`}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-muted-foreground mt-1">{step.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
