"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Loader2 } from "lucide-react";

interface GoalFormProps {
  owner: string;
  repo: string;
}

export function GoalForm({ owner, repo }: GoalFormProps) {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [depth, setDepth] = useState<"light" | "standard" | "deep">("standard");
  const [loading, setLoading] = useState(false);

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

      if (!res.ok) {
        throw new Error("Failed to start analysis");
      }

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
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Project Goal
                <span className="text-muted-foreground font-normal ml-1">
                  (optional)
                </span>
              </label>
              <Textarea
                placeholder="What are you trying to achieve with this project? e.g., 'Launch MVP by end of month' or 'Add payment processing'"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
              />
            </div>

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
