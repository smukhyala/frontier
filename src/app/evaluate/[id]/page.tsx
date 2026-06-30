"use client";

import { useParams } from "next/navigation";
import { useEvalStream } from "@/hooks/use-eval-stream";
import { ComparisonView } from "@/components/evaluate/comparison-view";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ComparisonPage() {
  const params = useParams<{ id: string }>();
  const comparisonId = params.id;

  const stream = useEvalStream(comparisonId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/evaluate"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          evaluations
        </Link>
      </div>

      <ComparisonView comparisonId={comparisonId} stream={stream} />
    </div>
  );
}
