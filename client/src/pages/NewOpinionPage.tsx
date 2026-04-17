import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Mic, StopCircle, Play, Pause } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/useUser";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import type { InsertOpinion } from "@shared/schema";
import { trackOpinionCreated } from "@/lib/analytics";

export default function NewOpinionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [shouldTranscribe, setShouldTranscribe] = useState(false);
  const voiceRecorder = useVoiceRecorder();

  useEffect(() => {
    return () => {
      if (voiceRecorder.audioUrl) {
        URL.revokeObjectURL(voiceRecorder.audioUrl);
      }
      voiceRecorder.clearRecording();
    };
  }, []);

  useEffect(() => {
    if (shouldTranscribe && voiceRecorder.audioBlob) {
      transcribeMutation.mutate(voiceRecorder.audioBlob);
      setShouldTranscribe(false);
    }
  }, [shouldTranscribe, voiceRecorder.audioBlob]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-20">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-muted-foreground mb-6">
              의견을 제출하려면 로그인해주세요.
            </p>
            <Button onClick={() => setLocation("/")}>
              홈으로 이동
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-recording.webm");
      
      const response = await authFetch("/api/opinions/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Transcription failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.text);
      toast({
        title: "음성이 텍스트로 변환되었습니다",
        description: "텍스트를 확인하고 수정할 수 있습니다.",
      });
      setTimeout(() => {
        document.getElementById("opinion-textarea")?.focus();
      }, 100);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "변환 실패",
        description: "음성을 텍스트로 변환하는 중 오류가 발생했습니다.",
      });
    },
  });

  const createOpinionMutation = useMutation({
    mutationFn: async (data: InsertOpinion) => {
      await apiRequest("POST", "/api/opinions", data);
      return null;
    },
    onMutate: async (newOpinion) => {
      await queryClient.cancelQueries({ queryKey: ["/api/opinions"] });
      
      const previousOpinions = queryClient.getQueryData(["/api/opinions"]);
      
      const optimisticOpinion = {
        id: `temp-${Date.now()}`,
        userId: user!.id,
        content: newOpinion.content,
        likes: 0,
        createdAt: new Date().toISOString(),
        username: user!.username,
        displayName: user!.displayName,
        avatarUrl: user!.avatarUrl,
      };
      
      // Update for infinite query structure
      queryClient.setQueryData(
        ["/api/opinions"],
        (old: any) => {
          if (!old) return { pages: [[optimisticOpinion]], pageParams: [0] };
          
          // For infinite query data structure
          if (old.pages) {
            const newPages = [[optimisticOpinion, ...old.pages[0]], ...old.pages.slice(1)];
            return { ...old, pages: newPages };
          }
          
          // Fallback for regular query (shouldn't happen but just in case)
          return [optimisticOpinion, ...(old || [])];
        }
      );
      
      return { previousOpinions };
    },
    onSuccess: () => {
      // GA 이벤트 추적: 의견 작성
      trackOpinionCreated("text");
      
      setLocation("/opinions");
      toast({
        title: "의견이 제출되었습니다",
        description: "관리자 검토 후 안건으로 전환될 수 있습니다.",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousOpinions) {
        queryClient.setQueryData(["/api/opinions"], context.previousOpinions);
      }
      toast({
        variant: "destructive",
        title: "제출 실패",
        description: "의견 제출 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "내용을 입력해주세요",
        description: "의견 내용은 필수 항목입니다.",
      });
      return;
    }

    createOpinionMutation.mutate({
      content: content.trim(),
      userId: user.id,
      type: "text",
    });
  };

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: "destructive",
        title: "지원되지 않는 브라우저",
        description: "이 브라우저는 음성 녹음을 지원하지 않습니다.",
      });
      return;
    }

    try {
      await voiceRecorder.startRecording();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "녹음 시작 실패",
        description: "마이크 권한을 확인해주세요.",
      });
    }
  };

  const handleStopRecording = () => {
    setShouldTranscribe(true);
    voiceRecorder.stopRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">의견 제안하기</h1>
            <p className="text-muted-foreground">
              지역사회 개선을 위한 의견을 자유롭게 제안해주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="p-6 cursor-pointer hover-elevate active-elevate-2"
              onClick={() => document.getElementById("opinion-textarea")?.focus()}
              data-testid="card-text-input"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">키보드로 입력하기</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    직접 의견을 작성합니다
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover-elevate active-elevate-2"
              onClick={handleStartRecording}
              data-testid="card-voice-input"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  voiceRecorder.isRecording ? "bg-destructive/10" : "bg-primary/10"
                }`}>
                  <Mic className={`w-6 h-6 ${voiceRecorder.isRecording ? "text-destructive" : "text-primary"}`} />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {voiceRecorder.isRecording ? "녹음 중..." : "음성으로 입력하기"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {voiceRecorder.isRecording ? "말씀해주세요" : "말하면 텍스트로 변환됩니다"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {voiceRecorder.isRecording && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                    <span className="text-lg font-mono">{formatTime(voiceRecorder.recordingTime)}</span>
                  </div>
                  <div className="flex gap-2">
                    {voiceRecorder.isPaused ? (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={voiceRecorder.resumeRecording}
                        data-testid="button-resume-recording"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={voiceRecorder.pauseRecording}
                        data-testid="button-pause-recording"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={handleStopRecording}
                      disabled={transcribeMutation.isPending}
                      data-testid="button-stop-recording"
                    >
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {voiceRecorder.isPaused ? "일시정지됨" : "녹음 중입니다. 의견을 자유롭게 말씀해주세요."}
                </p>
              </div>
            </Card>
          )}

          {transcribeMutation.isPending && (
            <Card className="p-6 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>음성을 텍스트로 변환 중입니다...</span>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                의견 내용
              </label>
              <Textarea
                id="opinion-textarea"
                placeholder="지역사회 개선을 위한 의견을 자유롭게 작성해주세요. 구체적으로 작성하실수록 더 좋은 논의가 이루어질 수 있습니다."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-48"
                disabled={createOpinionMutation.isPending || voiceRecorder.isRecording}
                data-testid="input-opinion-content"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {content.length}자
              </p>
            </div>

            {content.trim() && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-2">작성 전 확인사항</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 구체적인 문제 상황이 포함되어 있나요?</li>
                  <li>• 불필요한 욕설이나 비방이 없나요?</li>
                  <li>• 개인정보가 포함되지 않았나요?</li>
                </ul>
              </Card>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/opinions")}
              disabled={createOpinionMutation.isPending || voiceRecorder.isRecording}
              data-testid="button-cancel"
            >
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                !content.trim() ||
                voiceRecorder.isRecording ||
                createOpinionMutation.isPending ||
                transcribeMutation.isPending
              }
              data-testid="button-submit"
            >
              {createOpinionMutation.isPending ? "제출 중..." : "게시하기"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
