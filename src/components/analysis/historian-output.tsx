"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, AlertTriangle, Layers } from "lucide-react";
import type { ProjectState } from "@/lib/schemas";

const momentumConfig = {
  stalled: { label: "Stalled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  slow: { label: "Slow", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  steady: { label: "Steady", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rapid: { label: "Rapid", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export function HistorianOutput({ data }: { data: ProjectState }) {
  const mom = momentumConfig[data.momentum];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <BookOpen className="h-4 w-4 text-chart-1" />
            Project State
            <Badge variant="outline" className={mom.color}>
              {mom.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {data.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px] font-normal">
                {tech}
              </Badge>
            ))}
          </div>

          <div className="rounded-lg border border-chart-1/15 bg-chart-1/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-chart-1" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-chart-1/70">
                Inferred Frontier
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.inferredFrontier}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CompactList
              icon={<Layers className="h-3.5 w-3.5 text-chart-1" />}
              title="Active Workstreams"
              items={data.activeWorkstreams}
            />
            <CompactList
              icon={<AlertTriangle className="h-3.5 w-3.5 text-chart-4" />}
              title="Gaps"
              items={data.likelyMissingPieces}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CompactList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground leading-relaxed">
            &bull; {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
