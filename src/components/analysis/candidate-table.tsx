"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Shield,
  Eye,
  Target,
  Ruler,
  TrendingUp,
} from "lucide-react";
import type { ScoredTask } from "@/lib/schemas";

const typeColors: Record<string, string> = {
  implementation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  debugging: "bg-red-500/10 text-red-400 border-red-500/20",
  evaluation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  refactor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  documentation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  research: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  design: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  testing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const scoreLabels = [
  { key: "trajectoryFit", label: "Trajectory Fit", icon: TrendingUp },
  { key: "deadlineRelevance", label: "Deadline", icon: Clock },
  { key: "blockingPower", label: "Blocking Power", icon: Shield },
  { key: "informationGain", label: "Info Gain", icon: Eye },
  { key: "taskClarity", label: "Clarity", icon: Target },
  { key: "rightSized", label: "Right-Sized", icon: Ruler },
  { key: "momentum", label: "Momentum", icon: Zap },
] as const;

interface CandidateTableProps {
  tasks: ScoredTask[];
  selectedTaskId?: string;
}

export function CandidateTable({ tasks, selectedTaskId }: CandidateTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const maxScore = Math.max(...tasks.map((t) => t.totalScore), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            Candidate Tasks
            <Badge variant="secondary" className="text-xs font-normal">
              {tasks.length} tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Est.</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const isExpanded = expandedId === task.id;
                  const isSelected = selectedTaskId === task.id;

                  return (
                    <TableRow
                      key={task.id}
                      className="group cursor-pointer"
                      data-selected={isSelected}
                    >
                      <TableCell colSpan={5} className="p-0">
                        <div
                          className={`border-l-2 transition-all ${
                            isSelected
                              ? "border-l-primary bg-primary/5"
                              : "border-l-transparent hover:bg-muted/30"
                          }`}
                        >
                          <div
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : task.id)
                            }
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {task.title}
                                </span>
                                {isSelected && (
                                  <Badge className="bg-primary/20 text-primary text-xs shrink-0">
                                    Selected
                                  </Badge>
                                )}
                                <TaskBadges task={task} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {task.whyNow}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${typeColors[task.taskType] ?? ""}`}
                            >
                              {task.taskType}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {task.estimatedMinutes}m
                            </span>
                            <div className="flex items-center gap-2 shrink-0 w-24">
                              <Progress
                                value={(task.totalScore / 35) * 100}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                                {task.totalScore}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 border-t border-border/30 pt-3">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                                        Description
                                      </h5>
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {task.description}
                                      </p>

                                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 mt-4">
                                        Expected Artifact
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {task.expectedArtifact}
                                      </p>

                                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 mt-4">
                                        Critique
                                      </h5>
                                      <p className="text-sm text-amber-400/80">
                                        {task.critique}
                                      </p>

                                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 mt-4">
                                        Failure Mode
                                      </h5>
                                      <p className="text-sm text-red-400/80">
                                        {task.failureMode}
                                      </p>
                                    </div>

                                    <div>
                                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                                        Scores
                                      </h5>
                                      <div className="space-y-2.5">
                                        {scoreLabels.map(({ key, label, icon: Icon }) => (
                                          <div key={key} className="flex items-center gap-2">
                                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-xs text-muted-foreground w-24 shrink-0">
                                              {label}
                                            </span>
                                            <Progress
                                              value={
                                                (task.scores[key] / 5) * 100
                                              }
                                              className="h-1.5 flex-1"
                                            />
                                            <span className="text-xs font-mono w-4 text-right text-muted-foreground">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TaskBadges({ task }: { task: ScoredTask }) {
  const badges = [];
  if (task.scores.blockingPower >= 4) {
    badges.push(
      <Badge
        key="blocker"
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20"
      >
        High Blocker
      </Badge>
    );
  }
  if (task.scores.rightSized >= 4 && task.estimatedMinutes <= 45) {
    badges.push(
      <Badge
        key="fast"
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      >
        Fast Win
      </Badge>
    );
  }
  if (task.scores.informationGain >= 4) {
    badges.push(
      <Badge
        key="info"
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20"
      >
        High Info
      </Badge>
    );
  }
  if (task.scores.deadlineRelevance >= 4) {
    badges.push(
      <Badge
        key="deadline"
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-400 border-red-500/20"
      >
        Deadline Critical
      </Badge>
    );
  }
  return <>{badges}</>;
}
