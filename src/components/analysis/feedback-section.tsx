"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FeedbackSectionProps {
  owner: string;
  repo: string;
  previousGoal?: string;
  previousNotes?: string;
}

export function FeedbackSection({ owner, repo, previousGoal, previousNotes }: FeedbackSectionProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const notes = feedback.trim()
        ? [previousNotes, `User feedback: ${feedback.trim()}`].filter(Boolean).join("\n\n")
        : previousNotes;

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          goal: previousGoal || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch (err) {
      toast.error(`Failed to regenerate: ${err instanceof Error ? err.message : "unknown error"}`);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Refine & Regenerate</span>
      </div>

      <Textarea
        placeholder="e.g., I already finished the auth work. Focus on the payment flow instead."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        className="text-sm bg-secondary border-border mb-3"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs rounded-full px-4"
          disabled={loading}
          onClick={handleRegenerate}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : feedback.trim() ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate with feedback
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Rerun analysis
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
