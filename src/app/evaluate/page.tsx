import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createOctokit, getUserRepos } from "@/lib/github";
import { getComparisonsForUser } from "@/lib/db";
import { EvaluateView } from "@/components/evaluate/evaluate-view";

export default async function EvaluatePage() {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    redirect("/");
  }

  const octokit = createOctokit(session.accessToken);
  const repos = await getUserRepos(octokit);
  const comparisons = getComparisonsForUser(session.user.id, 20);

  // Compute aggregate stats
  const completed = comparisons.filter((c) => c.status === "completed");
  const voted = completed.filter((c) => c.winner);
  const withOutcome = completed.filter(
    (c) => c.baseline_prediction_score !== null && c.frontier_prediction_score !== null
  );

  const stats = {
    total: completed.length,
    baselineWins: voted.filter((c) => c.winner === "baseline").length,
    frontierWins: voted.filter((c) => c.winner === "frontier").length,
    ties: voted.filter((c) => c.winner === "tie").length,
    avgBaselineScore: withOutcome.length > 0
      ? Math.round(withOutcome.reduce((a, c) => a + (c.baseline_prediction_score ?? 0), 0) / withOutcome.length)
      : null,
    avgFrontierScore: withOutcome.length > 0
      ? Math.round(withOutcome.reduce((a, c) => a + (c.frontier_prediction_score ?? 0), 0) / withOutcome.length)
      : null,
  };

  return (
    <EvaluateView
      repos={repos}
      comparisons={comparisons.map((c) => ({
        id: c.id,
        owner: c.owner,
        repo: c.repo,
        goal: c.goal,
        status: c.status,
        winner: c.winner,
        baselineScore: c.baseline_prediction_score,
        frontierScore: c.frontier_prediction_score,
        createdAt: c.created_at,
      }))}
      stats={stats}
    />
  );
}
