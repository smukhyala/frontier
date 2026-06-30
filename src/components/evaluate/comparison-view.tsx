"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Beaker,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  TrendingUp,
  Minus,
  Loader2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import type { EvalStreamState } from "@/hooks/use-eval-stream";

interface ComparisonViewProps {
  comparisonId: string;
  stream: EvalStreamState;
}

const stageLabels: Record<string, string> = {
  baseline: "Baseline Planner",
  github: "GitHub Data",
  historian: "Historian",
  conjecturer: "Conjecturer",
  guide: "Guide",
  planner: "Frontier Planner",
  diff: "Diff Analysis",
};

const stageOrder = ["baseline", "github", "historian", "conjecturer", "guide", "planner", "diff"];

export function ComparisonView({ comparisonId, stream }: ComparisonViewProps) {
  const [winner, setWinner] = useState<"baseline" | "frontier" | "tie" | null>(null);
  const [voteNotes, setVoteNotes] = useState("");
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{
    baselineScore: number;
    frontierScore: number;
    baselineExplanation: string;
    frontierExplanation: string;
  } | null>(null);

  // Fetch existing vote and outcome data on mount
  useEffect(() => {
    fetch(`/api/evaluate/${comparisonId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.winner) {
          setWinner(d.winner);
          setVoted(true);
        }
        if (d.outcome_json) {
          setOutcomeData(d.outcome_json);
        }
      })
      .catch(() => {});
  }, [comparisonId]);

  const handleVote = async () => {
    if (!winner) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/evaluate/${comparisonId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner, notes: voteNotes || undefined }),
      });
      if (!res.ok) throw new Error();
      setVoted(true);
      toast.success("Vote recorded");
    } catch {
      toast.error("Failed to record vote");
    } finally {
      setVoting(false);
    }
  };

  const handleOutcome = async () => {
    setOutcomeLoading(true);
    try {
      const res = await fetch(`/api/evaluate/${comparisonId}/outcome`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOutcomeData(data);
      toast.success("Outcome evaluated");
    } catch {
      toast.error("Failed to evaluate outcome");
    } finally {
      setOutcomeLoading(false);
    }
  };

  const baseline = stream.baselineData;
  const frontier = stream.frontierData;
  const diff = stream.diffData;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {stageOrder.map((stage) => {
          const status = stream.stageStatuses[stage as keyof typeof stream.stageStatuses];
          return (
            <div key={stage} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  status === "complete"
                    ? "bg-chart-1"
                    : status === "running"
                      ? "bg-chart-4 animate-pulse"
                      : status === "error"
                        ? "bg-chart-5"
                        : "bg-secondary"
                }`}
              />
              <div className="text-[8px] text-muted-foreground mt-0.5 text-center truncate">
                {stageLabels[stage]}
              </div>
            </div>
          );
        })}
      </div>

      {stream.error && (
        <div className="rounded-lg border border-chart-5/20 bg-chart-5/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs text-chart-5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {stream.error}
          </div>
        </div>
      )}

      {/* Side-by-side Comparison */}
      {(baseline || frontier) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Column */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {baseline ? (
              <Card className="border-chart-5/15 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-chart-5 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    Baseline
                  </CardTitle>
                  <div className="text-[9px] text-muted-foreground/50">
                    Goal + deadline only. No project context.
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">{baseline.task}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {baseline.description}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {baseline.reasoning}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {baseline.estimatedMinutes}m
                  </div>

                  <ExecutionPlan plan={baseline.executionPlan} />

                  <div className="grid gap-2 text-xs">
                    <DoneAndRisks
                      done={baseline.definitionOfDone}
                      risks={baseline.risks}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LoadingCard label="Baseline" />
            )}
          </motion.div>

          {/* Frontier Column */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {frontier ? (
              <Card className="border-chart-1/15 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-chart-1 flex items-center gap-1.5">
                    <Beaker className="h-3 w-3" />
                    Frontier
                  </CardTitle>
                  <div className="text-[9px] text-muted-foreground/50">
                    Full pipeline: git history, README, issues, file activity.
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">
                      {frontier.selectedTask.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {frontier.selectedTask.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[9px] border-border"
                      >
                        {frontier.selectedTask.taskType}
                      </Badge>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {frontier.selectedTask.totalScore}/35
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {frontier.recommendation.reasoning}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {frontier.selectedTask.estimatedMinutes}m
                  </div>

                  <ExecutionPlan plan={frontier.recommendation.executionPlan} />

                  <DoneAndRisks
                    done={frontier.recommendation.definitionOfDone}
                    risks={frontier.recommendation.risks}
                  />

                  {/* Evidence Chain */}
                  {frontier.selectedTask.evidenceChain.length > 0 && (
                    <EvidenceSection evidence={frontier.selectedTask.evidenceChain} />
                  )}
                </CardContent>
              </Card>
            ) : (
              !stream.isComplete && <LoadingCard label="Frontier" />
            )}
          </motion.div>
        </div>
      )}

      {/* Loading state before anything comes back */}
      {!baseline && !frontier && !stream.error && !stream.isComplete && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingCard label="Baseline" />
          <LoadingCard label="Frontier" />
        </div>
      )}

      {/* Why Frontier Differs */}
      {diff && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-chart-4" />
                Why Frontier Differs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {diff.summary}
              </p>

              <div className="space-y-2">
                {diff.additionalSignals.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-secondary/40 p-2 text-[11px]"
                  >
                    <div className="font-medium text-foreground">{s.signal}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {s.impact}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground/80 italic">
                {diff.verdict}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Human Rating */}
      {stream.isComplete && !stream.error && baseline && frontier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                {voted ? "Your Vote" : "Which is better?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <VoteButton
                  label="Baseline better"
                  value="baseline"
                  current={winner}
                  onClick={() => !voted && setWinner("baseline")}
                  disabled={voted}
                  icon={<TrendingUp className="h-3 w-3" />}
                  accent="chart-5"
                />
                <VoteButton
                  label="Tie"
                  value="tie"
                  current={winner}
                  onClick={() => !voted && setWinner("tie")}
                  disabled={voted}
                  icon={<Minus className="h-3 w-3" />}
                  accent="muted-foreground"
                />
                <VoteButton
                  label="Frontier better"
                  value="frontier"
                  current={winner}
                  onClick={() => !voted && setWinner("frontier")}
                  disabled={voted}
                  icon={<Trophy className="h-3 w-3" />}
                  accent="chart-1"
                />
              </div>

              {!voted && (
                <>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={voteNotes}
                    onChange={(e) => setVoteNotes(e.target.value)}
                    className="text-xs min-h-[40px]"
                  />
                  <Button
                    onClick={handleVote}
                    disabled={!winner || voting}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {voting ? "Saving..." : "Submit Vote"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Outcome Evaluation */}
      {stream.isComplete && !stream.error && baseline && frontier && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" />
              Outcome Evaluation
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Run this after working on the repo to see which prediction matched reality.
            </p>
          </CardHeader>
          <CardContent>
            {outcomeData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ScoreCard
                    label="Baseline"
                    score={outcomeData.baselineScore}
                    explanation={outcomeData.baselineExplanation}
                    accent="chart-5"
                  />
                  <ScoreCard
                    label="Frontier"
                    score={outcomeData.frontierScore}
                    explanation={outcomeData.frontierExplanation}
                    accent="chart-1"
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={handleOutcome}
                disabled={outcomeLoading}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                {outcomeLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Evaluate Outcome"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExecutionPlan({
  plan,
}: {
  plan: {
    thirtyMinuteVersion: string[];
    sixtyMinuteVersion: string[];
    ninetyMinuteVersion: string[];
  };
}) {
  return (
    <Tabs defaultValue="60">
      <TabsList className="grid w-full grid-cols-3 h-7">
        <TabsTrigger value="30" className="text-[10px]">30m</TabsTrigger>
        <TabsTrigger value="60" className="text-[10px]">60m</TabsTrigger>
        <TabsTrigger value="90" className="text-[10px]">90m</TabsTrigger>
      </TabsList>
      {(["30", "60", "90"] as const).map((t) => (
        <TabsContent key={t} value={t} className="mt-2">
          <ol className="space-y-0.5">
            {(t === "30"
              ? plan.thirtyMinuteVersion
              : t === "60"
                ? plan.sixtyMinuteVersion
                : plan.ninetyMinuteVersion
            ).map((step, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px]">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-secondary text-[8px] font-mono text-muted-foreground mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function DoneAndRisks({
  done,
  risks,
}: {
  done: string[];
  risks: string[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/60" />
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Done when
          </span>
        </div>
        {done.map((d, i) => (
          <div key={i} className="text-muted-foreground">
            &bull; {d}
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <AlertTriangle className="h-2.5 w-2.5 text-chart-4/60" />
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Risks
          </span>
        </div>
        {risks.map((r, i) => (
          <div key={i} className="text-muted-foreground">
            &bull; {r}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceSection({
  evidence,
}: {
  evidence: { type: string; detail: string }[];
}) {
  const colors: Record<string, string> = {
    commit: "text-chart-1",
    file: "text-amber-400",
    readme: "text-emerald-400",
    goal: "text-purple-400",
    gap: "text-chart-5",
    code_comment: "text-orange-400",
  };

  return (
    <div className="rounded-md bg-secondary/40 p-2.5 space-y-1">
      <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wide mb-1">
        Evidence
      </div>
      {evidence.map((e, i) => (
        <div key={i} className="flex items-start gap-2 text-[10px]">
          <CheckCircle2 className={`h-2.5 w-2.5 mt-0.5 shrink-0 ${colors[e.type] ?? "text-muted-foreground"}`} />
          <span className={`font-mono shrink-0 w-14 ${colors[e.type] ?? "text-muted-foreground"}`}>
            {e.type}
          </span>
          <span className="text-muted-foreground">{e.detail}</span>
        </div>
      ))}
    </div>
  );
}

function VoteButton({
  label,
  value,
  current,
  onClick,
  disabled,
  icon,
  accent,
}: {
  label: string;
  value: "baseline" | "frontier" | "tie";
  current: string | null;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  accent: string;
}) {
  const isSelected = current === value;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border p-3 text-center transition-colors ${
        isSelected
          ? `border-${accent}/30 bg-${accent}/5`
          : "border-border hover:bg-secondary/30"
      } ${disabled && !isSelected ? "opacity-40" : ""}`}
    >
      <div className={`flex justify-center mb-1 ${isSelected ? `text-${accent}` : "text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </button>
  );
}

function ScoreCard({
  label,
  score,
  explanation,
  accent,
}: {
  label: string;
  score: number;
  explanation: string;
  accent: string;
}) {
  return (
    <div className={`rounded-lg border border-${accent}/15 p-3`}>
      <div className={`text-[10px] text-${accent}/60 font-mono mb-1`}>{label}</div>
      <div className={`text-2xl font-mono text-${accent}`}>
        {score}
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{explanation}</p>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
