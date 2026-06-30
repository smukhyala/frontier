"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScoredTask } from "@/lib/schemas";

const scoreKeys = [
  { key: "trajectoryFit", label: "Trajectory" },
  { key: "deadlineRelevance", label: "Deadline" },
  { key: "blockingPower", label: "Blocking" },
  { key: "informationGain", label: "Info Gain" },
  { key: "taskClarity", label: "Clarity" },
  { key: "rightSized", label: "Size" },
  { key: "momentum", label: "Momentum" },
] as const;

interface CandidateTableProps {
  tasks: ScoredTask[];
  selectedTaskId?: string;
}

export function CandidateTable({ tasks, selectedTaskId }: CandidateTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Candidate Tasks
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {tasks.length} generated
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_50px_60px_28px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wide text-muted-foreground/50 border-b border-border">
            <span>Task</span>
            <span>Type</span>
            <span className="text-right">Time</span>
            <span className="text-right">Score</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const isExpanded = expandedId === task.id;
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={isSelected ? "bg-chart-1/[0.03]" : ""}
                >
                  <div
                    className="grid grid-cols-[1fr_80px_50px_60px_28px] gap-2 px-4 py-2.5 items-start cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-1.5">
                        {isSelected && (
                          <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-[9px] px-1 py-0 shrink-0 mt-0.5">
                            pick
                          </Badge>
                        )}
                        <span className="text-sm leading-snug break-words">
                          {task.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/40 mt-0.5 leading-relaxed">
                        {task.whyNow}
                      </p>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal px-1.5 py-0 border-border"
                      >
                        {task.taskType}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground tabular-nums">
                      {task.estimatedMinutes}m
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono tabular-nums">
                        {task.totalScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground/30">/35</span>
                    </div>
                    <div className="flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/30" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/50">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wide mb-1">
                                  Description
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wide mb-1">
                                  Critique
                                </div>
                                <p className="text-xs text-chart-5/60 leading-relaxed">
                                  {task.critique}
                                </p>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wide mb-2">
                                Scores
                              </div>
                              <div className="space-y-1.5">
                                {scoreKeys.map(({ key, label }) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground/40 w-16 shrink-0">
                                      {label}
                                    </span>
                                    <Progress
                                      value={(task.scores[key] / 5) * 100}
                                      className="h-1 flex-1"
                                    />
                                    <span className="text-[10px] font-mono text-muted-foreground/40 w-3 text-right">
                                      {task.scores[key]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
