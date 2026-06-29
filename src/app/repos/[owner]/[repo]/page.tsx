import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createOctokit, getRepoInfo } from "@/lib/github";
import { getRunsByRepo } from "@/lib/db";
import { RepoHeader } from "@/components/dashboard/repo-header";
import { GoalForm } from "@/components/dashboard/goal-form";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";

export default async function RepoDashboardPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.id) {
    redirect("/");
  }

  const { owner, repo } = await params;

  const octokit = createOctokit(session.accessToken);
  const repoInfo = await getRepoInfo(octokit, owner, repo);
  const recentRuns = getRunsByRepo(owner, repo, session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <RepoHeader repo={repoInfo} />
      <GoalForm owner={owner} repo={repo} />
      <RecentAnalyses runs={recentRuns} />
    </div>
  );
}
