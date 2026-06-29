"use client";

import { motion } from "motion/react";
import { BookOpen, Lightbulb, Scale, Target, Check, Loader2 } from "lucide-react";
import type { PipelineStage, PipelineStatus } from "@/lib/frontier/pipeline";

const stages: {
  key: PipelineStage;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "historian", label: "Historian", icon: BookOpen, color: "text-blue-400" },
  { key: "conjecturer", label: "Conjecturer", icon: Lightbulb, color: "text-amber-400" },
  { key: "guide", label: "Guide", icon: Scale, color: "text-emerald-400" },
  { key: "planner", label: "Planner", icon: Target, color: "text-purple-400" },
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
    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-8">
      {stages.map((stage, index) => {
        const status = stageStatuses[stage.key];
        const isActive = currentStage === stage.key && status === "running";
        const isComplete = status === "complete";
        const isError = status === "error";

        return (
          <div key={stage.key} className="flex items-center flex-1">
            <motion.div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm flex-1 justify-center transition-all ${
                isComplete
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : isActive
                    ? "border-primary/40 bg-primary/10"
                    : isError
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-border/40 bg-muted/20"
              }`}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
            >
              {isComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                </motion.div>
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <stage.icon
                  className={`h-4 w-4 ${
                    isError ? "text-red-400" : "text-muted-foreground/50"
                  }`}
                />
              )}
              <span
                className={`hidden sm:inline ${
                  isComplete
                    ? "text-emerald-400"
                    : isActive
                      ? "text-primary font-medium"
                      : isError
                        ? "text-red-400"
                        : "text-muted-foreground/50"
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
            {index < stages.length - 1 && (
              <div
                className={`hidden sm:block w-4 h-px mx-1 ${
                  isComplete ? "bg-emerald-500/40" : "bg-border/40"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
