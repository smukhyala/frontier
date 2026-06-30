"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAnalysisStream } from "@/hooks/use-analysis-stream";
import { PipelineProgress } from "@/components/analysis/pipeline-progress";
import { HistorianOutput } from "@/components/analysis/historian-output";
import { CommitGraph } from "@/components/analysis/commit-graph";
import { CandidateTable } from "@/components/analysis/candidate-table";
import { RecommendationCard } from "@/components/analysis/recommendation-card";
import { FileHeatmap } from "@/components/analysis/file-heatmap";
import { TaskTimeline } from "@/components/analysis/task-timeline";
import { ProgressNote } from "@/components/analysis/progress-note";
import { FeedbackSection } from "@/components/analysis/feedback-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const analysisId = params.id;
  const [meta, setMeta] = useState<{ owner: string; repo: string; goal?: string; notes?: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const {
    currentStage,
    isComplete,
    error,
    historianData,
    guideData,
    plannerData,
    stageStatuses,
  } = useAnalysisStream(analysisId);

  useEffect(() => {
    fetch(`/api/analysis/${analysisId}`)
      .then((r) => r.json())
      .then((d) => setMeta({ owner: d.owner, repo: d.repo, goal: d.goal, notes: d.notes }))
      .catch(() => {});
  }, [analysisId]);

  const selectedTask =
    plannerData && guideData
      ? guideData.find((t) => t.id === plannerData.selectedTaskId) ?? guideData[0]
      : null;

  // Auto-scroll to top when recommendation loads
  useEffect(() => {
    if (plannerData && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [plannerData]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div ref={topRef} />
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          dashboard
        </Link>
        {isComplete && !error && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => router.back()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Rerun
          </Button>
        )}
      </div>

      <PipelineProgress
        stageStatuses={stageStatuses}
        currentStage={currentStage}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-chart-5/20 bg-chart-5/[0.03] p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-4 w-4 text-chart-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-chart-5">
                Pipeline failed{currentStage ? ` at ${currentStage}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error.includes("429") ? "Rate limited — wait a minute and retry." :
                 error.includes("401") || error.includes("403") ? "Authentication error — try signing out and back in." :
                 error.includes("timeout") ? "The LLM call timed out — try again with 'light' depth." :
                 "Something went wrong in the analysis pipeline."}
              </p>
            </div>
          </div>
          {meta && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-border"
              onClick={() => {
                fetch("/api/analysis", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ owner: meta.owner, repo: meta.repo }),
                })
                  .then((r) => r.json())
                  .then((d) => router.push(`/analysis/${d.analysisId}`))
                  .catch(() => {});
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </motion.div>
      )}

      <div className="space-y-6 mt-2">
        {plannerData && selectedTask && (
          <RecommendationCard
            recommendation={plannerData}
            selectedTask={selectedTask}
            analysisId={analysisId}
          />
        )}

        {/* Feedback + Progress */}
        {isComplete && !error && meta && (
          <div className="space-y-3">
            <FeedbackSection
              owner={meta.owner}
              repo={meta.repo}
              previousGoal={meta.goal}
              previousNotes={meta.notes}
            />
            <ProgressNote
              owner={meta.owner}
              repo={meta.repo}
              previousGoal={meta.goal}
            />
          </div>
        )}

        {historianData && <CommitGraph projectState={historianData} />}

        {historianData && (() => {
          const fa = (historianData as unknown as Record<string, unknown>)._fileActivity;
          if (!fa) return null;
          return <FileHeatmap data={fa as import("@/lib/frontier/file-analysis").FileAnalysisResult} />;
        })()}

        {historianData ? (
          <HistorianOutput data={historianData} />
        ) : (
          !isComplete && !error && <LoadingSkeleton />
        )}

        {guideData ? (
          <CandidateTable
            tasks={guideData}
            selectedTaskId={plannerData?.selectedTaskId}
          />
        ) : (
          historianData && !isComplete && !error && <LoadingSkeleton />
        )}

        {guideData && !plannerData && !isComplete && !error && <LoadingSkeleton />}

        {/* Task history timeline */}
        {isComplete && !error && meta && (
          <TaskTimeline
            owner={meta.owner}
            repo={meta.repo}
            currentAnalysisId={analysisId}
          />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-border p-5 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
