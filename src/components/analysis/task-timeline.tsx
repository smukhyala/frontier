"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import Link from "next/link";

interface TimelineEntry {
  analysisId: string;
  date: string;
  taskTitle: string;
  taskType: string;
  score: number;
}

export function TaskTimeline({
  owner,
  repo,
  currentAnalysisId,
}: {
  owner: string;
  repo: string;
  currentAnalysisId: string;
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    fetch(`/api/repos/${owner}/${repo}/history`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(() => {});
  }, [owner, repo]);

  if (entries.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <History className="h-4 w-4 text-muted-foreground" />
            Recommendation History
            <span className="text-xs text-muted-foreground font-normal">
              {entries.length} analyses
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-3 left-0 right-0 h-px bg-border" />

            <div className="flex gap-1 overflow-x-auto pb-2">
              {entries.map((entry, i) => {
                const isCurrent = entry.analysisId === currentAnalysisId;
                const date = new Date(entry.date);
                const label = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Link
                    key={entry.analysisId}
                    href={`/analysis/${entry.analysisId}`}
                    className="shrink-0"
                  >
                    <motion.div
                      className={`relative pt-5 px-2 pb-1 rounded-lg min-w-[100px] text-center transition-colors ${
                        isCurrent
                          ? "bg-chart-1/[0.05]"
                          : "hover:bg-secondary/30"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      {/* Dot */}
                      <div
                        className={`absolute top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 ${
                          isCurrent
                            ? "bg-chart-1 border-chart-1/30"
                            : "bg-background border-border"
                        }`}
                      />

                      <div className="text-[10px] text-muted-foreground/60">{label}</div>
                      <p
                        className={`text-[11px] mt-1 leading-snug ${
                          isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {entry.taskTitle}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 border-border font-normal"
                        >
                          {entry.taskType}
                        </Badge>
                        <span className="text-[9px] font-mono text-muted-foreground/50">
                          {entry.score}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
