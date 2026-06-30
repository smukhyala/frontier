"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu } from "lucide-react";

interface ModelData {
  trained: boolean;
  samples: number;
  accuracy: number | null;
  loss: number | null;
}

export function ModelStats({ data }: { data: ModelData | null }) {
  if (!data || !data.trained) return null;

  const accPct = data.accuracy ? Math.round(data.accuracy * 100) : 0;

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
              <Cpu className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">Scoring Model</span>
                <span className="text-[10px] text-emerald-400">trained</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] text-muted-foreground">Accuracy</span>
                  <Progress value={accPct} className="h-1.5 flex-1 max-w-[100px]" />
                  <span className="text-[10px] font-mono text-muted-foreground">{accPct}%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {data.samples} samples
                </span>
                {data.loss !== null && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    loss: {data.loss.toFixed(3)}
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
