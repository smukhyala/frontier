"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCommit, FileCode } from "lucide-react";
import type { ProjectState } from "@/lib/schemas";

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: string[];
}

interface CommitGraphProps {
  projectState: ProjectState & { _commits?: CommitData[] };
}

// Color palette for themes
const themeColors = [
  { bg: "bg-chart-1/15", text: "text-chart-1", bar: "bg-chart-1/50" },
  { bg: "bg-chart-4/15", text: "text-chart-4", bar: "bg-chart-4/50" },
  { bg: "bg-emerald-400/15", text: "text-emerald-400", bar: "bg-emerald-400/50" },
  { bg: "bg-amber-400/15", text: "text-amber-400", bar: "bg-amber-400/50" },
  { bg: "bg-purple-400/15", text: "text-purple-400", bar: "bg-purple-400/50" },
  { bg: "bg-cyan-400/15", text: "text-cyan-400", bar: "bg-cyan-400/50" },
];

function categorizeCommit(message: string): string {
  const msg = message.toLowerCase();
  if (msg.match(/fix|bug|patch|hotfix|resolve/)) return "fixes";
  if (msg.match(/feat|add|implement|create|build|new/)) return "features";
  if (msg.match(/refactor|clean|reorganize|restructure|simplify/)) return "refactoring";
  if (msg.match(/test|spec|coverage/)) return "testing";
  if (msg.match(/doc|readme|comment|typo/)) return "docs";
  if (msg.match(/style|css|ui|design|layout|visual/)) return "styling";
  if (msg.match(/config|setup|install|dep|version|bump|update/)) return "config";
  if (msg.match(/merge|revert/)) return "merges";
  return "development";
}

export function CommitGraph({ projectState }: CommitGraphProps) {
  const commits = projectState._commits ?? [];

  // Group commits by day
  const grouped = useMemo(() => {
    const groups: { date: string; commits: CommitData[] }[] = [];
    let currentDate = "";
    for (const c of commits) {
      const day = c.date
        ? new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Unknown";
      if (day !== currentDate) {
        currentDate = day;
        groups.push({ date: day, commits: [] });
      }
      groups[groups.length - 1].commits.push(c);
    }
    return groups;
  }, [commits]);

  // Categorize commits into themes
  const themes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of commits) {
      const theme = categorizeCommit(c.message);
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        name,
        count,
        color: themeColors[i % themeColors.length],
      }));
  }, [commits]);

  // Map theme name to color for commit badges
  const themeColorMap = useMemo(() => {
    const map = new Map<string, (typeof themeColors)[0]>();
    themes.forEach((t) => map.set(t.name, t.color));
    return map;
  }, [themes]);

  if (commits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-medium">
              <GitCommit className="h-4 w-4 text-muted-foreground" />
              Commit Timeline
            </div>
            <span className="text-xs text-muted-foreground font-normal">
              {commits.length} analyzed
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Timeline */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/50" />

                <div className="space-y-4">
                  {grouped.map((group, gi) => (
                    <div key={gi}>
                      <div className="relative flex items-center gap-3 mb-2">
                        <div className="h-[15px] w-[15px] rounded-full border-2 border-muted-foreground/20 bg-background z-10 flex items-center justify-center">
                          <div className="h-[5px] w-[5px] rounded-full bg-muted-foreground/40" />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {group.date}
                        </span>
                      </div>

                      <div className="space-y-1 ml-[7px] pl-5 border-l border-transparent">
                        {group.commits.map((commit, ci) => {
                          const theme = categorizeCommit(commit.message);
                          const color = themeColorMap.get(theme) ?? themeColors[0];

                          return (
                            <motion.div
                              key={commit.sha}
                              className="group flex items-start gap-2 rounded-md px-2 py-1.5 -ml-2 hover:bg-secondary/50 transition-colors"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: gi * 0.04 + ci * 0.02 }}
                            >
                              <code className="text-[10px] font-mono text-muted-foreground/50 mt-0.5 shrink-0">
                                {commit.sha}
                              </code>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-1.5">
                                  <p className="text-xs leading-relaxed">
                                    {commit.message.split("\n")[0]}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1 py-0 shrink-0 border-0 ${color.bg} ${color.text}`}
                                  >
                                    {theme}
                                  </Badge>
                                </div>
                                {commit.filesChanged.length > 0 && (
                                  <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FileCode className="h-2.5 w-2.5 text-muted-foreground/50" />
                                    <span className="text-[10px] text-muted-foreground/50">
                                      {commit.filesChanged.slice(0, 3).join(", ")}
                                      {commit.filesChanged.length > 3 &&
                                        ` +${commit.filesChanged.length - 3}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: commit themes */}
            <div className="hidden lg:block w-56 shrink-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Commit Themes
              </div>
              <div className="space-y-2">
                {themes.map((theme, i) => (
                  <motion.div
                    key={theme.name}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                  >
                    <div
                      className={`h-2 rounded-full ${theme.color.bar}`}
                      style={{
                        width: `${Math.max(16, (theme.count / (themes[0]?.count ?? 1)) * 100)}%`,
                      }}
                    />
                    <span className={`text-[10px] shrink-0 capitalize ${theme.color.text}`}>
                      {theme.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {theme.count}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Momentum */}
              <div className="mt-6 flex items-center gap-2">
                <MomentumDots momentum={projectState.momentum} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MomentumDots({ momentum }: { momentum: string }) {
  const levels = ["stalled", "slow", "steady", "active", "rapid"];
  const idx = levels.indexOf(momentum);
  const colors = [
    "bg-chart-5",
    "bg-chart-4",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-emerald-400",
  ];

  return (
    <>
      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">
        Momentum
      </span>
      <div className="flex gap-1">
        {levels.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-3 rounded-sm ${i <= idx ? colors[idx] + "/50" : "bg-muted/20"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground/50 capitalize">{momentum}</span>
    </>
  );
}
