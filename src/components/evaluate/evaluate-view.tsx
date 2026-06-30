"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Beaker, Trophy, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";

interface Repo {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
}

interface ComparisonSummary {
  id: string;
  owner: string;
  repo: string;
  goal: string | null;
  status: string;
  winner: string | null;
  baselineScore: number | null;
  frontierScore: number | null;
  createdAt: string;
}

interface Stats {
  total: number;
  baselineWins: number;
  frontierWins: number;
  ties: number;
  avgBaselineScore: number | null;
  avgFrontierScore: number | null;
}

export function EvaluateView({
  repos,
  comparisons,
  stats,
}: {
  repos: Repo[];
  comparisons: ComparisonSummary[];
  stats: Stats;
}) {
  const router = useRouter();
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRepos = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRun = async () => {
    if (!selectedRepo) {
      toast.error("Select a repository");
      return;
    }

    const [owner, repo] = selectedRepo.split("/");
    setLoading(true);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, goal: goal || undefined, deadline: deadline || undefined, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/evaluate/${data.comparisonId}`);
    } catch {
      toast.error("Failed to start comparison");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Beaker className="h-4 w-4 text-chart-1" />
          Evaluation
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Can project trajectory outperform static planning?
        </p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Comparisons" value={stats.total} />
          <StatCard
            label="Frontier Wins"
            value={stats.frontierWins}
            accent="text-chart-1"
          />
          <StatCard
            label="Baseline Wins"
            value={stats.baselineWins}
            accent="text-chart-5"
          />
          <StatCard label="Ties" value={stats.ties} />
          {stats.avgFrontierScore !== null && (
            <StatCard
              label="Avg Frontier Score"
              value={stats.avgFrontierScore}
              accent="text-chart-1"
              suffix="/100"
            />
          )}
          {stats.avgBaselineScore !== null && (
            <StatCard
              label="Avg Baseline Score"
              value={stats.avgBaselineScore}
              accent="text-chart-5"
              suffix="/100"
            />
          )}
        </div>
      )}

      {/* New Comparison Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Run Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
              Repository
            </label>
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs mb-2"
            />
            <div className="max-h-32 overflow-y-auto rounded-md border border-border">
              {filteredRepos.slice(0, 20).map((repo) => (
                <button
                  key={repo.fullName}
                  onClick={() => {
                    setSelectedRepo(repo.fullName);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary/50 transition-colors flex items-center justify-between ${
                    selectedRepo === repo.fullName
                      ? "bg-chart-1/5 text-chart-1"
                      : "text-foreground"
                  }`}
                >
                  <span className="font-mono">{repo.fullName}</span>
                  {repo.language && (
                    <span className="text-[10px] text-muted-foreground">
                      {repo.language}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedRepo && (
              <div className="mt-1.5 text-[10px] text-chart-1 font-mono">
                Selected: {selectedRepo}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
              Goal
            </label>
            <Input
              placeholder="What are you trying to achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
              Deadline (optional)
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Additional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!selectedRepo || loading}
            className="w-full h-9 text-xs"
          >
            {loading ? "Starting..." : "Run Comparison"}
          </Button>
        </CardContent>
      </Card>

      {/* Past Comparisons */}
      {comparisons.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">Past Comparisons</h2>
          <div className="space-y-2">
            {comparisons.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/evaluate/${c.id}`)}
                className="w-full text-left rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">
                      {c.owner}/{c.repo}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        c.status === "completed"
                          ? "border-emerald-400/30 text-emerald-400"
                          : c.status === "failed"
                            ? "border-chart-5/30 text-chart-5"
                            : "border-chart-4/30 text-chart-4"
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.winner && (
                      <WinnerBadge winner={c.winner} />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {c.goal && (
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {c.goal}
                  </p>
                )}
                {c.baselineScore !== null && c.frontierScore !== null && (
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                    <span className="text-muted-foreground">
                      Baseline: <span className="font-mono">{c.baselineScore}</span>/100
                    </span>
                    <span className="text-muted-foreground">
                      Frontier: <span className="font-mono text-chart-1">{c.frontierScore}</span>/100
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`text-lg font-mono mt-0.5 ${accent ?? "text-foreground"}`}>
        {value}
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function WinnerBadge({ winner }: { winner: string }) {
  if (winner === "frontier") {
    return (
      <Badge variant="outline" className="text-[9px] border-chart-1/30 text-chart-1 gap-0.5">
        <Trophy className="h-2.5 w-2.5" /> Frontier
      </Badge>
    );
  }
  if (winner === "baseline") {
    return (
      <Badge variant="outline" className="text-[9px] border-chart-5/30 text-chart-5 gap-0.5">
        <TrendingUp className="h-2.5 w-2.5" /> Baseline
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[9px] border-border gap-0.5">
      <Minus className="h-2.5 w-2.5" /> Tie
    </Badge>
  );
}
