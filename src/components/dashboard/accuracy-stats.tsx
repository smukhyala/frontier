"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface AccuracyData {
  overall: number;
  count: number;
  trend: "improving" | "stable" | "declining";
}

export function AccuracyStats({ data }: { data: AccuracyData }) {
  if (data.count < 2) return null;

  const pct = Math.round(data.overall * 100);
  const trendLabel = data.trend === "improving" ? "Improving" : data.trend === "declining" ? "Declining" : "Stable";
  const trendColor = data.trend === "improving" ? "text-emerald-400" : data.trend === "declining" ? "text-chart-5" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="h-4 w-4 text-muted-foreground" />
            Prediction Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-3xl font-medium tabular-nums">{pct}%</div>
              <div className="text-xs text-muted-foreground">
                {data.count} analyses
              </div>
            </div>
            <div className="flex-1">
              <Progress value={pct} className="h-2" />
            </div>
            <span className={`text-xs ${trendColor}`}>{trendLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Compares each recommendation to your subsequent commits using semantic
            matching. Feeds back into the Guide to improve future scoring.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
