"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, MessageSquare } from "lucide-react";

interface ProgressNoteProps {
  owner: string;
  repo: string;
  previousGoal?: string;
}

export function ProgressNote({ owner, repo, previousGoal }: ProgressNoteProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRerun = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          goal: previousGoal,
          notes: note || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="h-3 w-3" />
        Update progress & get new task
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-lg border border-border p-4"
    >
      <div className="text-xs text-muted-foreground mb-2">
        What did you just finish? The next task will shift based on this.
      </div>
      <Textarea
        placeholder="e.g., Finished the auth flow, tests passing. Still need to wire up the dashboard."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="text-sm bg-secondary border-border mb-3"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs rounded-full px-4"
          disabled={loading}
          onClick={handleRerun}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              Find next task
              <ArrowRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
