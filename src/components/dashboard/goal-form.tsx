"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Compass,
  Loader2,
  Sparkles,
  CheckCircle2,
  Pencil,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GoalFormProps {
  owner: string;
  repo: string;
}

interface InferredGoal {
  goal: string;
  confidence: "high" | "medium" | "low";
  signals: string[];
  currentPhase: string;
  recentFocus: string;
}

const confidenceColors = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function GoalForm({ owner, repo }: GoalFormProps) {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [depth, setDepth] = useState<"light" | "standard" | "deep">("standard");
  const [loading, setLoading] = useState(false);
  const [inferring, setInferring] = useState(true);
  const [inferred, setInferred] = useState<InferredGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function inferGoal() {
      try {
        const res = await fetch(`/api/repos/${owner}/${repo}/infer-goal`);
        if (res.ok) {
          const data: InferredGoal = await res.json();
          setInferred(data);
          setGoal(data.goal);
        }
      } catch {
        // Inference failed, user can still type manually
      } finally {
        setInferring(false);
      }
    }
    inferGoal();
  }, [owner, repo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          goal: goal || undefined,
          deadline: deadline || undefined,
          notes: notes || undefined,
          depth,
        }),
      });

      if (!res.ok) throw new Error("Failed to start analysis");

      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Find Your Frontier Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Inferred Goal Section */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Project Goal
              </label>

              {inferring ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Inferring goal from README and commits...
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : inferred && !isEditing ? (
                <div className="space-y-3">
                  {/* Inferred goal display */}
                  <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-medium text-primary">
                            Inferred from repository
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${confidenceColors[inferred.confidence]}`}
                          >
                            {inferred.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{inferred.goal}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="shrink-0 h-7 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>

                    <Separator className="my-3 bg-primary/10" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                          Current Phase
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {inferred.currentPhase}
                        </p>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                          Recent Focus
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {inferred.recentFocus}
                        </p>
                      </div>
                    </div>

                    {/* Signals */}
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
                        Signals Used
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inferred.signals.map((signal, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="What are you trying to achieve with this project?"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={3}
                  />
                  {inferred && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGoal(inferred.goal);
                        setIsEditing(false);
                      }}
                      className="text-xs text-muted-foreground"
                    >
                      Revert to inferred goal
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Additional options
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-5"
                >
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Deadline
                      <span className="text-muted-foreground font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Extra Context
                      <span className="text-muted-foreground font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <Textarea
                      placeholder="Any additional context, constraints, or preferences..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Analysis Depth
                    </label>
                    <div className="flex gap-2">
                      {(["light", "standard", "deep"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDepth(d)}
                          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                            depth === d
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                          <div className="text-xs font-normal mt-0.5 text-muted-foreground">
                            {d === "light"
                              ? "15 commits"
                              : d === "standard"
                                ? "30 commits"
                                : "50 commits"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting analysis...
                </>
              ) : (
                <>
                  <Compass className="mr-2 h-4 w-4" />
                  Find my frontier task
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
