"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, ArrowRight, Star, Lock, Globe, Clock, Zap } from "lucide-react";
import { ContextDialog } from "./context-dialog";
import { WeekCalendar } from "./week-calendar";
import { AccuracyStats } from "./accuracy-stats";
import { LearningStatus } from "./learning-status";
import { ModelStats } from "./model-stats";
import type { FrontierCard, ScheduleTask } from "@/app/dashboard/page";

interface Repo {
  id: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  isPrivate: boolean;
  pushedAt: string | null;
}

export function DashboardView({
  repos,
  frontierCards,
  scheduleTasks,
  accuracyData,
  learningData,
  modelData,
}: {
  repos: Repo[];
  frontierCards: FrontierCard[];
  scheduleTasks: ScheduleTask[];
  accuracyData: { overall: number; count: number; trend: "improving" | "stable" | "declining" } | null;
  learningData: { totalTasks: number; completedTasks: number; avgAccuracy: number | null; successfulTypes: string[]; failedTypes: string[] };
  modelData: { trained: boolean; samples: number; accuracy: number | null; loss: number | null } | null;
}) {
  const [search, setSearch] = useState("");
  const [dialogRepo, setDialogRepo] = useState<{ owner: string; repo: string } | null>(null);
  const [autoEnabled, setAutoEnabled] = useState<Set<string>>(new Set());

  const toggleAuto = async (owner: string, repo: string) => {
    const key = `${owner}/${repo}`;
    const isEnabled = autoEnabled.has(key);
    try {
      await fetch(`/api/repos/${owner}/${repo}/webhook`, {
        method: isEnabled ? "DELETE" : "POST",
      });
      setAutoEnabled((prev) => {
        const next = new Set(prev);
        if (isEnabled) next.delete(key);
        else next.add(key);
        return next;
      });
    } catch {}
  };

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-muted-foreground mb-6">dashboard</p>

        {/* Weekly calendar */}
        <WeekCalendar tasks={scheduleTasks} />

        {/* ML model status */}
        <ModelStats data={modelData} />

        {/* Learning status */}
        <LearningStatus data={learningData} />

        {/* Accuracy stats */}
        {accuracyData && <AccuracyStats data={accuracyData} />}

        {/* Frontier task cards */}
        {frontierCards.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-medium tracking-tight mb-4">
              Frontier Tasks
            </h2>
            <div className="space-y-2">
              {frontierCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/analysis/${card.id}`}>
                    <div className="rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {card.repo}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 border-border font-normal"
                            >
                              {card.taskType}
                            </Badge>
                            {card.deadline && (
                              <span className="text-[9px] text-chart-4 font-mono">
                                due: {card.deadline}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium leading-snug break-words">
                            {card.taskTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {card.estimatedMinutes}m
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/60">
                            {card.score}/35
                          </span>
                        </div>
                      </div>

                      {/* Description + evidence */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                        {card.description}
                      </p>
                      <div className="flex items-start gap-1.5">
                        <span className="text-[9px] font-mono text-chart-1/40 mt-px shrink-0">why</span>
                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                          {card.whyNow}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Repo list */}
        <h2 className="text-lg font-medium tracking-tight mb-4">
          Repositories
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg bg-secondary border-border"
          />
        </div>

        <div className="space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No repositories found.
            </p>
          ) : (
            filtered.map((repo, i) => (
              <motion.div
                key={repo.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {repo.name}
                    </span>
                    {repo.isPrivate ? (
                      <Lock className="h-3 w-3 text-muted-foreground/20" />
                    ) : (
                      <Globe className="h-3 w-3 text-muted-foreground/20" />
                    )}
                    {repo.language && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>

                {repo.stargazersCount > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/20 shrink-0">
                    <Star className="h-2.5 w-2.5" />
                    {repo.stargazersCount}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-7 text-[10px] rounded-full px-2 shrink-0 transition-opacity ${
                    autoEnabled.has(`${repo.owner}/${repo.name}`)
                      ? "opacity-100 text-chart-1"
                      : "opacity-0 group-hover:opacity-100 text-muted-foreground/60"
                  }`}
                  onClick={() => toggleAuto(repo.owner, repo.name)}
                  title={autoEnabled.has(`${repo.owner}/${repo.name}`) ? "Auto-analysis on push (click to disable)" : "Enable auto-analysis on push"}
                >
                  <Zap className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs rounded-full px-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => setDialogRepo({ owner: repo.owner, repo: repo.name })}
                >
                  Analyze
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {dialogRepo && (
        <ContextDialog
          open={true}
          onClose={() => setDialogRepo(null)}
          owner={dialogRepo.owner}
          repo={dialogRepo.repo}
        />
      )}
    </div>
  );
}
