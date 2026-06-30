"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";
import type { FrontierRecommendation, ScoredTask } from "@/lib/schemas";
import { toast } from "sonner";

interface RecommendationCardProps {
  recommendation: FrontierRecommendation;
  selectedTask: ScoredTask;
  analysisId: string;
}

export function RecommendationCard({
  recommendation,
  selectedTask,
  analysisId,
}: RecommendationCardProps) {
  const { copied, copy } = useCopyClipboard();
  const [issueCreating, setIssueCreating] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"recommended" | "started" | "done">("recommended");

  const handleCopy = () => {
    copy(formatPlan(recommendation, selectedTask));
    toast.success("Copied");
  };

  const handleCreateIssue = async () => {
    setIssueCreating(true);
    try {
      const res = await fetch(`/api/analysis/${analysisId}/issue`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIssueUrl(data.url);
      toast.success("Issue created");
    } catch {
      toast.error("Failed");
    } finally {
      setIssueCreating(false);
    }
  };

  const handleTaskStatus = async (status: "started" | "done") => {
    try {
      await fetch(`/api/analysis/${analysisId}/task-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          title: selectedTask.title,
          status,
        }),
      });
      setTaskStatus(status);
      toast.success(status === "started" ? "Marked as started" : "Marked as done");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-chart-1/15">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-chart-1">
                <Target className="h-3.5 w-3.5" />
                Frontier Task
              </CardTitle>
              <h3 className="mt-1.5 text-lg font-medium">{selectedTask.title}</h3>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-border">{selectedTask.taskType}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {selectedTask.estimatedMinutes}m
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {selectedTask.totalScore}/35
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {taskStatus === "recommended" && (
                <Button variant="outline" size="sm" className="h-7 text-xs border-border" onClick={() => handleTaskStatus("started")}>
                  Start
                </Button>
              )}
              {taskStatus === "started" && (
                <Button variant="outline" size="sm" className="h-7 text-xs border-chart-1/30 text-chart-1" onClick={() => handleTaskStatus("done")}>
                  Done
                </Button>
              )}
              {taskStatus === "done" && (
                <Badge variant="outline" className="text-[10px] border-emerald-400/30 text-emerald-400 h-7 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs border-border" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              {issueUrl ? (
                <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs border-border" onClick={handleCreateIssue} disabled={issueCreating}>
                  {issueCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitHubIcon className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Why + goal connection */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.reasoning}
            </p>

            {/* Goal/deadline connection */}
            {recommendation.goalConnection && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-chart-1 font-mono text-[10px] mt-0.5 shrink-0">goal</span>
                <span className="text-muted-foreground">{recommendation.goalConnection}</span>
              </div>
            )}

            {/* Evidence chain */}
            {selectedTask.evidenceChain && selectedTask.evidenceChain.length > 0 && (
              <div className="rounded-md bg-secondary/40 p-2.5 space-y-1">
                <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wide mb-1">reasoning trace</div>
                {selectedTask.evidenceChain.map((e, i) => {
                  const colors: Record<string, string> = {
                    commit: "text-chart-1",
                    file: "text-amber-400",
                    readme: "text-emerald-400",
                    goal: "text-purple-400",
                    gap: "text-chart-5",
                    code_comment: "text-orange-400",
                  };
                  return (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className={`font-mono ${colors[e.type] ?? "text-muted-foreground"} shrink-0 w-12`}>{e.type}</span>
                      <span className="text-muted-foreground">{e.detail}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Execution Plans */}
          <Tabs defaultValue="60">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="30" className="text-xs">30m</TabsTrigger>
              <TabsTrigger value="60" className="text-xs">60m</TabsTrigger>
              <TabsTrigger value="90" className="text-xs">90m</TabsTrigger>
            </TabsList>
            {(["30", "60", "90"] as const).map((t) => (
              <TabsContent key={t} value={t} className="mt-3">
                <ol className="space-y-1">
                  {(t === "30" ? recommendation.executionPlan.thirtyMinuteVersion :
                    t === "60" ? recommendation.executionPlan.sixtyMinuteVersion :
                    recommendation.executionPlan.ninetyMinuteVersion
                  ).map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-mono text-muted-foreground mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>

          {/* Done + Risks - compact */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Done when</span>
              </div>
              {recommendation.definitionOfDone.map((d, i) => (
                <div key={i} className="text-muted-foreground leading-relaxed">&bull; {d}</div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-chart-4/60" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Risks</span>
              </div>
              {recommendation.risks.map((r, i) => (
                <div key={i} className="text-muted-foreground leading-relaxed">&bull; {r}</div>
              ))}
            </div>
          </div>

          {/* Specific generic vs frontier comparison */}
          {recommendation.genericAlternative && (
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md bg-chart-5/[0.04] border border-chart-5/10 p-2.5">
                <div className="text-[10px] text-chart-5/60 font-mono mb-1">generic planner</div>
                <p className="text-muted-foreground/60 leading-relaxed">
                  {recommendation.genericAlternative}
                </p>
              </div>
              <div className="rounded-md bg-chart-1/[0.04] border border-chart-1/10 p-2.5">
                <div className="text-[10px] text-chart-1/60 font-mono mb-1">frontier</div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedTask.title} — grounded in your last {selectedTask.estimatedMinutes < 60 ? "few" : "several"} commits.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatPlan(rec: FrontierRecommendation, task: ScoredTask): string {
  return `# ${task.title}\n\n${rec.reasoning}\n\n## Steps (60m)\n${rec.executionPlan.sixtyMinuteVersion.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n## Done when\n${rec.definitionOfDone.map((d) => `- [ ] ${d}`).join("\n")}`;
}
