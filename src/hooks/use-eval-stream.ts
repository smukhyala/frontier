"use client";

import { useState, useEffect } from "react";
import type { EvalStage, EvalStatus } from "@/lib/frontier/evaluation";
import type { BaselineRecommendation } from "@/lib/frontier/baseline-planner";
import type { DiffAnalysis } from "@/lib/frontier/evaluation";
import type { FrontierRecommendation, ScoredTask, ProjectState } from "@/lib/schemas";

export interface EvalStreamState {
  currentStage: EvalStage | null;
  isComplete: boolean;
  error: string | null;
  baselineData: BaselineRecommendation | null;
  frontierData: {
    recommendation: FrontierRecommendation;
    selectedTask: ScoredTask;
    projectState: ProjectState;
  } | null;
  diffData: DiffAnalysis | null;
  stageStatuses: Record<EvalStage, EvalStatus | null>;
}

const initialStageStatuses: Record<EvalStage, EvalStatus | null> = {
  baseline: null,
  github: null,
  historian: null,
  conjecturer: null,
  guide: null,
  planner: null,
  diff: null,
};

export function useEvalStream(comparisonId: string): EvalStreamState {
  const [state, setState] = useState<EvalStreamState>({
    currentStage: null,
    isComplete: false,
    error: null,
    baselineData: null,
    frontierData: null,
    diffData: null,
    stageStatuses: { ...initialStageStatuses },
  });

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/evaluate/${comparisonId}/stream`
    );

    eventSource.addEventListener("eval", (event) => {
      const data = JSON.parse(event.data) as {
        stage: EvalStage;
        status: EvalStatus;
        data?: unknown;
        error?: string;
      };

      setState((prev) => {
        const next = { ...prev };
        next.stageStatuses = {
          ...prev.stageStatuses,
          [data.stage]: data.status,
        };

        if (data.status === "running") {
          next.currentStage = data.stage;
        }

        if (data.status === "complete" && data.data) {
          switch (data.stage) {
            case "baseline":
              next.baselineData = data.data as BaselineRecommendation;
              break;
            case "planner":
              next.frontierData = data.data as EvalStreamState["frontierData"];
              break;
            case "diff":
              next.diffData = data.data as DiffAnalysis;
              break;
          }
        }

        if (data.status === "error") {
          next.error = data.error ?? `Error in ${data.stage}`;
        }

        return next;
      });
    });

    eventSource.addEventListener("done", () => {
      setState((prev) => ({ ...prev, isComplete: true }));
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      eventSource.close();
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setState((prev) => ({
          ...prev,
          error: data.error ?? "Connection error",
          isComplete: true,
        }));
      } catch {
        setState((prev) => {
          if (!prev.isComplete && !prev.error) {
            return { ...prev, error: "Connection lost", isComplete: true };
          }
          return prev;
        });
      }
    });

    return () => {
      eventSource.close();
    };
  }, [comparisonId]);

  return state;
}
