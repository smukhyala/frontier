"use client";

import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import type { PipelineStage, PipelineStatus } from "@/lib/frontier/pipeline";

const stages: { key: PipelineStage; label: string }[] = [
  { key: "historian", label: "Historian" },
  { key: "conjecturer", label: "Conjecturer" },
  { key: "guide", label: "Guide" },
  { key: "planner", label: "Planner" },
];

interface PipelineProgressProps {
  stageStatuses: Record<PipelineStage, PipelineStatus | null>;
  currentStage: PipelineStage | null;
}

export function PipelineProgress({
  stageStatuses,
  currentStage,
}: PipelineProgressProps) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {stages.map((stage, i) => {
        const status = stageStatuses[stage.key];
        const isActive = currentStage === stage.key && status === "running";
        const isComplete = status === "complete";
        const isError = status === "error";

        return (
          <div key={stage.key} className="flex items-center gap-1 flex-1">
            <div
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs flex-1 justify-center border transition-all ${
                isComplete
                  ? "border-foreground/10 text-foreground"
                  : isActive
                    ? "border-border bg-secondary text-foreground"
                    : isError
                      ? "border-chart-5/20 text-chart-5"
                      : "border-transparent text-muted-foreground/50"
              }`}
            >
              {isComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              <span>{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`w-2 h-px ${isComplete ? "bg-foreground/10" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
