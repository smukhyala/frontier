"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";

interface ContextDialogProps {
  open: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
}

export function ContextDialog({ open, onClose, owner, repo }: ContextDialogProps) {
  const router = useRouter();
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineFor, setDeadlineFor] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);

  const buildDeadlineString = () => {
    if (!deadlineDate && !deadlineFor) return undefined;
    const parts = [];
    if (deadlineDate) parts.push(deadlineDate);
    if (deadlineFor) parts.push(`for: ${deadlineFor}`);
    return parts.join(" — ");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          deadline: buildDeadlineString(),
          notes: context || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (!res.ok) throw new Error();
      const { analysisId } = await res.json();
      router.push(`/analysis/${analysisId}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Quick context for{" "}
            <span className="font-mono text-sm text-muted-foreground">
              {owner}/{repo}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Helps the pipeline prioritize. All optional.
          </p>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Working toward a deadline?
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="h-8 text-sm bg-secondary border-border w-40"
              />
              <Input
                placeholder="What's it for? e.g., MVP demo, beta launch"
                value={deadlineFor}
                onChange={(e) => setDeadlineFor(e.target.value)}
                className="h-8 text-sm bg-secondary border-border flex-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Anything the repo doesn&apos;t capture?
            </label>
            <Textarea
              placeholder="e.g., Auth is done but untested. We dropped Notion integration. Waiting on design feedback for the dashboard."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="text-sm bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 h-8 text-xs rounded-full"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  Analyze
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="h-8 text-xs"
              disabled={loading}
              onClick={handleSkip}
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
