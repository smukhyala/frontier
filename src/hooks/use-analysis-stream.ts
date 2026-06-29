"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ProjectState,
  CandidateTask,
  ScoredTask,
  FrontierRecommendation,
} from "@/lib/schemas";
import type { PipelineStage, PipelineStatus } from "@/lib/frontier/pipeline";

export interface AnalysisStreamState {
  currentStage: PipelineStage | null;
  isComplete: boolean;
  error: string | null;
  historianData: ProjectState | null;
  conjecturerData: CandidateTask[] | null;
  guideData: ScoredTask[] | null;
  plannerData: FrontierRecommendation | null;
  stageStatuses: Record<PipelineStage, PipelineStatus | null>;
}

export function useAnalysisStream(analysisId: string): AnalysisStreamState {
  const [state, setState] = useState<AnalysisStreamState>({
    currentStage: null,
    isComplete: false,
    error: null,
    historianData: null,
    conjecturerData: null,
    guideData: null,
    plannerData: null,
    stageStatuses: {
      historian: null,
      conjecturer: null,
      guide: null,
      planner: null,
    },
  });

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/analysis/${analysisId}/stream`
    );

    eventSource.addEventListener("pipeline", (event) => {
      const data = JSON.parse(event.data) as {
        stage: PipelineStage;
        status: PipelineStatus;
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
            case "historian":
              next.historianData = data.data as ProjectState;
              break;
            case "conjecturer":
              next.conjecturerData = data.data as CandidateTask[];
              break;
            case "guide":
              next.guideData = data.data as ScoredTask[];
              break;
            case "planner":
              next.plannerData = data.data as FrontierRecommendation;
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
      // Try to parse error data
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setState((prev) => ({
          ...prev,
          error: data.error ?? "Connection error",
          isComplete: true,
        }));
      } catch {
        // EventSource native error (connection lost)
        if (eventSource.readyState === EventSource.CLOSED) {
          setState((prev) => {
            if (!prev.isComplete && !prev.error) {
              return { ...prev, error: "Connection lost", isComplete: true };
            }
            return prev;
          });
        }
      }
    });

    return () => {
      eventSource.close();
    };
  }, [analysisId]);

  return state;
}
