"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Flame } from "lucide-react";
import type { FileAnalysisResult } from "@/lib/frontier/file-analysis";

const areaColors = [
  "bg-chart-1/20 text-chart-1",
  "bg-chart-5/20 text-chart-5",
  "bg-emerald-400/20 text-emerald-400",
  "bg-amber-400/20 text-amber-400",
  "bg-purple-400/20 text-purple-400",
  "bg-cyan-400/20 text-cyan-400",
];

export function FileHeatmap({ data }: { data: FileAnalysisResult }) {
  if (data.areas.length === 0 && data.hotspots.length === 0) return null;

  const maxEdits = data.areas[0]?.editCount ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            File Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Area treemap */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {data.areas.map((area, i) => {
              const ratio = area.editCount / maxEdits;
              const colorClass = areaColors[i % areaColors.length];
              return (
                <motion.div
                  key={area.area}
                  className={`rounded-lg ${colorClass} px-3 py-2`}
                  style={{ flexBasis: `${Math.max(15, ratio * 40)}%`, flexGrow: ratio }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="text-xs font-mono font-medium">{area.area}/</div>
                  <div className="text-[10px] opacity-60">
                    {area.editCount} edits &middot; {area.fileCount} files
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Hotspots */}
          {data.hotspots.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="h-3 w-3 text-chart-5/60" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Hotspots — edited 3+ times
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.hotspots.map((file, i) => (
                  <span
                    key={file}
                    className="text-[10px] font-mono text-muted-foreground bg-secondary rounded px-1.5 py-0.5"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
