"use client";

import { motion } from "motion/react";
import { PipelineProgress } from "@/components/analysis/pipeline-progress";
import { HistorianOutput } from "@/components/analysis/historian-output";
import { CommitGraph } from "@/components/analysis/commit-graph";
import { FileHeatmap } from "@/components/analysis/file-heatmap";
import { CandidateTable } from "@/components/analysis/candidate-table";
import { RecommendationCard } from "@/components/analysis/recommendation-card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  demoProjectState,
  demoScoredTasks,
  demoRecommendation,
} from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          back
        </Link>
        <Badge variant="outline" className="text-[10px] border-chart-1/20 text-chart-1">
          Demo — example e-commerce repo
        </Badge>
      </div>

      <PipelineProgress
        stageStatuses={{
          historian: "complete",
          conjecturer: "complete",
          guide: "complete",
          planner: "complete",
        }}
        currentStage={null}
      />

      <div className="space-y-6 mt-2">
        <RecommendationCard
          recommendation={demoRecommendation}
          selectedTask={demoScoredTasks[0]}
          analysisId="demo"
        />

        <CommitGraph projectState={demoProjectState} />

        <FileHeatmap data={demoProjectState._fileActivity} />

        <HistorianOutput data={demoProjectState} />

        <CandidateTable
          tasks={demoScoredTasks}
          selectedTaskId={demoRecommendation.selectedTaskId}
        />
      </div>
    </div>
  );
}
