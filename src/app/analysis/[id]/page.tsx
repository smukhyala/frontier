"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAnalysisStream } from "@/hooks/use-analysis-stream";
import { PipelineProgress } from "@/components/analysis/pipeline-progress";
import { HistorianOutput } from "@/components/analysis/historian-output";
import { CommitGraph } from "@/components/analysis/commit-graph";
import { CandidateTable } from "@/components/analysis/candidate-table";
import { RecommendationCard } from "@/components/analysis/recommendation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const analysisId = params.id;

  const {
    currentStage,
    isComplete,
    error,
    historianData,
    conjecturerData,
    guideData,
    plannerData,
    stageStatuses,
  } = useAnalysisStream(analysisId);

  const selectedTask =
    plannerData && guideData
      ? guideData.find((t) => t.id === plannerData.selectedTaskId) ?? guideData[0]
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/repos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to repos
        </Link>
        {isComplete && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Trigger regeneration by going back - handled by the dashboard
              router.back();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            New Analysis
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
        >
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <p className="font-medium text-red-400">Analysis failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Recommendation card at top when complete */}
        {plannerData && selectedTask && (
          <RecommendationCard
            recommendation={plannerData}
            selectedTask={selectedTask}
            analysisId={analysisId}
          />
        )}

        {/* Knowledge Graph */}
        {historianData && (
          <CommitGraph projectState={historianData} />
        )}

        {/* Historian output */}
        {historianData ? (
          <HistorianOutput data={historianData} />
        ) : (
          !isComplete &&
          !error && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Candidate tasks table */}
        {guideData ? (
          <CandidateTable
            tasks={guideData}
            selectedTaskId={plannerData?.selectedTaskId}
          />
        ) : (
          historianData &&
          !isComplete &&
          !error && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          )
        )}

        {/* Loading placeholder for planner */}
        {guideData && !plannerData && !isComplete && !error && (
          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
