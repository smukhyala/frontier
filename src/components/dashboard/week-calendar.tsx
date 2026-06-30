"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, Calendar, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ScheduleTask } from "@/app/dashboard/page";

const typeColors: Record<string, string> = {
  implementation: "border-l-chart-1",
  debugging: "border-l-chart-5",
  refactor: "border-l-amber-400",
  testing: "border-l-emerald-400",
  documentation: "border-l-purple-400",
  design: "border-l-pink-400",
  research: "border-l-cyan-400",
  evaluation: "border-l-orange-400",
};

// Assign a consistent color per repo for the dot
const repoColors = [
  "bg-chart-1",
  "bg-chart-5",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-purple-400",
  "bg-cyan-400",
  "bg-pink-400",
  "bg-orange-400",
];

export function WeekCalendar({ tasks }: { tasks: ScheduleTask[] }) {
  const allRepos = useMemo(() => {
    const set = new Set(tasks.map((t) => t.repo));
    return [...set];
  }, [tasks]);

  const repoColorMap = useMemo(() => {
    const map = new Map<string, string>();
    allRepos.forEach((r, i) => map.set(r, repoColors[i % repoColors.length]));
    return map;
  }, [allRepos]);

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(
    () => new Set(allRepos.slice(0, 3))
  );

  const toggleRepo = (repo: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  };

  const filteredTasks = useMemo(
    () => tasks.filter((t) => selectedRepos.has(t.repo)),
    [tasks, selectedRepos]
  );

  const schedule = useMemo(() => {
    const today = new Date();
    const days: { label: string; sub: string; tasks: ScheduleTask[] }[] = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "long" }),
        sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tasks: [],
      });
    }

    // Distribute by balancing total minutes per day — no hard cap
    const sorted = [...filteredTasks].sort((a, b) => b.score - a.score);
    const dayMinutes = days.map(() => 0);

    for (const task of sorted) {
      let minDay = 0;
      let minTime = dayMinutes[0];
      for (let i = 0; i < days.length; i++) {
        if (dayMinutes[i] < minTime) {
          minTime = dayMinutes[i];
          minDay = i;
        }
      }
      days[minDay].tasks.push(task);
      dayMinutes[minDay] += task.estimatedMinutes;
    }

    return days;
  }, [filteredTasks]);

  if (tasks.length === 0) return null;

  const deadline = filteredTasks.find((t) => t.deadline)?.deadline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground/50" />
          <h2 className="text-lg font-medium tracking-tight">
            Suggested Dev Schedule
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {deadline && (
            <span className="text-[10px] text-chart-4 font-mono">
              deadline: {deadline}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-muted-foreground px-2"
            onClick={() => exportToIcs(schedule)}
          >
            <Download className="h-3 w-3 mr-1" />
            .ics
          </Button>
        </div>
      </div>

      {/* Repo filter with color dots */}
      {allRepos.length > 1 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mr-1">
            repos
          </span>
          {allRepos.map((repo) => {
            const isSelected = selectedRepos.has(repo);
            const dotColor = repoColorMap.get(repo) ?? "bg-muted-foreground";
            return (
              <button
                key={repo}
                onClick={() => toggleRepo(repo)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                  isSelected
                    ? "bg-secondary text-foreground border border-border"
                    : "text-muted-foreground/50 border border-transparent hover:text-muted-foreground/60"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${dotColor} ${isSelected ? "opacity-60" : "opacity-20"}`} />
                {repo}
                {isSelected && <X className="h-2.5 w-2.5 text-muted-foreground/50" />}
              </button>
            );
          })}
        </div>
      )}

      {/* 5-column calendar */}
      <div className="grid grid-cols-5 gap-3">
        {schedule.map((day, di) => {
          const totalMin = day.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
          const isToday = di === 0;

          return (
            <motion.div
              key={di}
              className={`rounded-xl border p-4 min-h-[200px] flex flex-col ${
                isToday ? "border-chart-1/20 bg-chart-1/[0.02]" : "border-border"
              }`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.04 }}
            >
              <div className="mb-4">
                <div className={`text-sm font-medium ${isToday ? "text-chart-1" : "text-foreground"}`}>
                  {day.label}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/60">{day.sub}</span>
                  {totalMin > 0 && (
                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {totalMin}m
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {day.tasks.map((task, ti) => {
                  const repoDot = repoColorMap.get(task.repo) ?? "bg-muted-foreground";
                  return (
                    <Link
                      key={`${task.analysisId}-${task.id}-${ti}`}
                      href={`/analysis/${task.analysisId}`}
                    >
                      <div
                        className={`rounded-lg border-l-2 ${typeColors[task.taskType] ?? "border-l-muted-foreground"} ${task.isFrontierPick ? "bg-chart-1/[0.06] ring-1 ring-chart-1/10" : "bg-secondary/30"} p-2.5 hover:bg-secondary/60 transition-colors cursor-pointer`}
                      >
                        {task.isFrontierPick && (
                          <span className="text-[8px] font-mono text-chart-1/70 uppercase tracking-wider">frontier pick</span>
                        )}
                        <p className="text-xs leading-relaxed font-medium mb-1.5">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${repoDot} opacity-50`} />
                          <span className="text-[10px] text-muted-foreground/60 truncate">
                            {task.repo}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">
                            {task.estimatedMinutes}m
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {day.tasks.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/15 mt-8 text-center">
                    open
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Task type colors */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">types</span>
          {Object.entries(typeColors)
            .filter(([type]) => filteredTasks.some((t) => t.taskType === type))
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-3 h-1.5 rounded-sm border-l-2 ${color}`} />
                <span className="text-[9px] text-muted-foreground/60 capitalize">{type}</span>
              </div>
            ))}
        </div>

        {/* Repo colors */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">repos</span>
          {allRepos.filter((r) => selectedRepos.has(r)).map((repo) => {
            const dot = repoColorMap.get(repo) ?? "bg-muted-foreground";
            return (
              <div key={repo} className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${dot} opacity-60`} />
                <span className="text-[9px] text-muted-foreground/60 font-mono">{repo}</span>
              </div>
            );
          })}
        </div>

        {/* Frontier indicator */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-chart-1/[0.06] ring-1 ring-chart-1/10" />
          <span className="text-[9px] text-muted-foreground/60">frontier pick</span>
        </div>
      </div>
    </motion.div>
  );
}

function exportToIcs(schedule: { label: string; sub: string; tasks: ScheduleTask[] }[]) {
  const today = new Date();
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Frontier//EN"];

  for (let i = 0; i < schedule.length; i++) {
    const day = schedule[i];
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    for (const task of day.tasks) {
      const endDate = new Date(date.getTime() + task.estimatedMinutes * 60000);
      const endStr = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      lines.push(
        "BEGIN:VEVENT",
        `DTSTART:${dateStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${task.repo} — ${task.description.replace(/\n/g, "\\n")}`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "frontier-schedule.ics";
  a.click();
  URL.revokeObjectURL(url);
}
