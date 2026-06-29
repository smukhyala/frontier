import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getRun } from "@/lib/db";
import {
  pipelineEmitters,
  type PipelineEvent,
} from "@/lib/frontier/pipeline";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send catch-up events from DB (for page refresh)
      const run = getRun(id);
      if (run) {
        const stages = [
          "historian",
          "conjecturer",
          "guide",
          "planner",
        ] as const;
        for (const stage of stages) {
          const output = run[`${stage}_output` as keyof typeof run];
          if (output) {
            send("pipeline", {
              stage,
              status: "complete",
              data: JSON.parse(output as string),
            });
          }
        }

        if (run.status === "completed") {
          send("done", { status: "completed" });
          controller.close();
          return;
        }

        if (run.status === "failed") {
          send("error", { error: run.error });
          controller.close();
          return;
        }
      }

      // Subscribe to live events
      const emitter = pipelineEmitters.get(id);
      if (!emitter) {
        // Pipeline might not have started yet or already finished
        if (run?.status === "pending") {
          // Wait briefly for pipeline to start
          const checkInterval = setInterval(() => {
            const em = pipelineEmitters.get(id);
            if (em) {
              clearInterval(checkInterval);
              subscribeToEmitter(em);
            }
            // Also check if it completed while we waited
            const currentRun = getRun(id);
            if (currentRun?.status === "completed" || currentRun?.status === "failed") {
              clearInterval(checkInterval);
              if (currentRun.status === "completed") {
                send("done", { status: "completed" });
              } else {
                send("error", { error: currentRun.error });
              }
              controller.close();
            }
          }, 500);

          // Timeout after 60 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            send("error", { error: "Timeout waiting for pipeline" });
            controller.close();
          }, 60000);
        } else {
          send("done", { status: run?.status ?? "unknown" });
          controller.close();
        }
        return;
      }

      subscribeToEmitter(emitter);

      function subscribeToEmitter(emitter: import("events").EventEmitter) {
        const onEvent = (event: PipelineEvent) => {
          try {
            send("pipeline", event);
          } catch {
            // Stream might be closed
          }
        };

        const onDone = () => {
          try {
            send("done", { status: "completed" });
            controller.close();
          } catch {
            // Stream might be closed
          }
          cleanup();
        };

        const cleanup = () => {
          emitter.off("event", onEvent);
          emitter.off("done", onDone);
        };

        emitter.on("event", onEvent);
        emitter.on("done", onDone);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
