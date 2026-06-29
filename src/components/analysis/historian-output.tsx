"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  Activity,
} from "lucide-react";
import type { ProjectState } from "@/lib/schemas";

const momentumConfig = {
  stalled: { label: "Stalled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  slow: { label: "Slow", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  steady: { label: "Steady", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Project State
            <Badge variant="outline" className={mom.color}>
              <Activity className="h-3 w-3 mr-1" />
              {mom.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {data.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                {tech}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Inferred Frontier
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.inferredFrontier}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              title="Recent Trajectory"
              items={data.recentTrajectory}
            />
            <Section
              icon={<Layers className="h-4 w-4 text-blue-400" />}
              title="Active Workstreams"
              items={data.activeWorkstreams}
            />
            <Section
              icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              title="Likely Missing Pieces"
              items={data.likelyMissingPieces}
            />
            <Section
              icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
              title="Uncertainty"
              items={data.uncertainty}
            />
          </div>

          {data.blockers.length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Blockers
              </h4>
              <ul className="space-y-1">
                {data.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    &bull; {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({
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
      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground">
            &bull; {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
