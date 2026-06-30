"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface LearningData {
  totalTasks: number;
  completedTasks: number;
  avgAccuracy: number | null;
  successfulTypes: string[];
  failedTypes: string[];
}

export function LearningStatus({ data }: { data: LearningData }) {
  if (data.totalTasks === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
              <Brain className="h-4 w-4 text-chart-1" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Learning from {data.totalTasks} past tasks</span>
                <span className="text-[10px] text-muted-foreground">
                  {data.completedTasks} completed, {data.totalTasks - data.completedTasks} tracked
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {data.avgAccuracy !== null && (
                  <span className="text-[10px] text-muted-foreground">
                    Prediction accuracy: {Math.round(data.avgAccuracy * 100)}%
                  </span>
                )}
                {data.successfulTypes.length > 0 && (
                  <span className="text-[10px] text-emerald-400">
                    Prefers: {data.successfulTypes.join(", ")}
                  </span>
                )}
                {data.failedTypes.length > 0 && (
                  <span className="text-[10px] text-chart-5">
                    Skips: {data.failedTypes.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
