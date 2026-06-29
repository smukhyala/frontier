"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import type { AnalysisRunRow } from "@/lib/db";

export function RecentAnalyses({ runs }: { runs: AnalysisRunRow[] }) {
  if (runs.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Analyses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/analysis/${run.id}`}
              className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={run.status} />
                <div className="text-sm truncate">
                  {run.goal ? (
                    <span className="text-foreground">{run.goal}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No goal specified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleDateString()}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          Done
        </Badge>
      );
    case "running":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-500/10 text-blue-400 border-blue-500/20"
        >
          Running
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="secondary"
          className="bg-red-500/10 text-red-400 border-red-500/20"
        >
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      );
  }
}
