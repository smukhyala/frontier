"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";
import type { FrontierRecommendation, ScoredTask } from "@/lib/schemas";
import { toast } from "sonner";

interface RecommendationCardProps {
  recommendation: FrontierRecommendation;
  selectedTask: ScoredTask;
  analysisId: string;
}

export function RecommendationCard({
  recommendation,
  selectedTask,
  analysisId,
}: RecommendationCardProps) {
  const { copied, copy } = useCopyClipboard();
  const [issueCreating, setIssueCreating] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const handleCopy = () => {
    const plan = formatPlanAsMarkdown(recommendation, selectedTask);
    copy(plan);
    toast.success("Plan copied to clipboard");
  };

  const handleCreateIssue = async () => {
    setIssueCreating(true);
    try {
      const res = await fetch(`/api/analysis/${analysisId}/issue`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create issue");
      const data = await res.json();
      setIssueUrl(data.url);
      toast.success("GitHub issue created");
    } catch {
      toast.error("Failed to create GitHub issue");
    } finally {
      setIssueCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-primary" />
                Recommended Next Task
              </CardTitle>
              <h3 className="mt-2 text-lg font-semibold">
                {selectedTask.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {selectedTask.taskType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{selectedTask.estimatedMinutes} min
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Score: {selectedTask.totalScore}/35
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy Plan"}
              </Button>
              {issueUrl ? (
                <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Issue
                  </Button>
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateIssue}
                  disabled={issueCreating}
                >
                  {issueCreating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <GitHubIcon className="h-4 w-4 mr-1" />
                  )}
                  Create Issue
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="text-sm font-medium mb-2">Why this task?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Execution Plan</h4>
            <Tabs defaultValue="60">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="30">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  30 min
                </TabsTrigger>
                <TabsTrigger value="60">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  60 min
                </TabsTrigger>
                <TabsTrigger value="90">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  90 min
                </TabsTrigger>
              </TabsList>
              <TabsContent value="30" className="mt-4">
                <StepList steps={recommendation.executionPlan.thirtyMinuteVersion} />
              </TabsContent>
              <TabsContent value="60" className="mt-4">
                <StepList steps={recommendation.executionPlan.sixtyMinuteVersion} />
              </TabsContent>
              <TabsContent value="90" className="mt-4">
                <StepList steps={recommendation.executionPlan.ninetyMinuteVersion} />
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Definition of Done
              </h4>
              <ul className="space-y-1.5">
                {recommendation.definitionOfDone.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Risks
                </h4>
                <ul className="space-y-1.5">
                  {recommendation.risks.map((risk, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {recommendation.missingContext.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Missing Context
                  </h4>
                  <ul className="space-y-1.5">
                    {recommendation.missingContext.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {i + 1}
          </span>
          <span className="text-muted-foreground leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function formatPlanAsMarkdown(
  rec: FrontierRecommendation,
  task: ScoredTask
): string {
  return `# ${task.title}

**Type:** ${task.taskType} | **Est:** ${task.estimatedMinutes} min | **Score:** ${task.totalScore}/35

## Why This Task
${rec.reasoning}

## Execution Plan (60 min)
${rec.executionPlan.sixtyMinuteVersion.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Definition of Done
${rec.definitionOfDone.map((d) => `- [ ] ${d}`).join("\n")}

## Risks
${rec.risks.map((r) => `- ${r}`).join("\n")}

---
*Generated by Frontier*
`;
}
