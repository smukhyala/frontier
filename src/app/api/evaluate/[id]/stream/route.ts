import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getComparison } from "@/lib/db";
import { evalEmitters } from "@/lib/frontier/evaluation";
import type { EvalEvent } from "@/lib/frontier/evaluation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const comparison = getComparison(id);
  if (!comparison) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Catch up from DB state
      if (comparison.baseline_json) {
        send("eval", {
          stage: "baseline",
          status: "complete",
          data: JSON.parse(comparison.baseline_json),
        });
      }
      if (comparison.frontier_json) {
        const frontier = JSON.parse(comparison.frontier_json);
        // Emit individual stages as complete
        if (frontier.projectState) {
          send("eval", { stage: "historian", status: "complete", data: frontier.projectState });
        }
        send("eval", { stage: "planner", status: "complete", data: frontier });
      }
      if (comparison.diff_json) {
        send("eval", {
          stage: "diff",
          status: "complete",
          data: JSON.parse(comparison.diff_json),
        });
      }
      if (comparison.status === "completed" || comparison.status === "failed") {
        send("done", { status: comparison.status });
        controller.close();
        return;
      }

      // Subscribe to live events
      const emitter = evalEmitters.get(id);
      if (!emitter) {
        send("done", { status: comparison.status === "completed" ? "completed" : "pending" });
        controller.close();
        return;
      }

      const onEvent = (event: EvalEvent) => {
        try {
          send("eval", event);
        } catch {
          // Stream closed
        }
      };

      const onDone = () => {
        try {
          send("done", { status: "completed" });
          controller.close();
        } catch {
          // Stream closed
        }
        cleanup();
      };

      const cleanup = () => {
        emitter.removeListener("event", onEvent);
        emitter.removeListener("done", onDone);
      };

      emitter.on("event", onEvent);
      emitter.on("done", onDone);
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
