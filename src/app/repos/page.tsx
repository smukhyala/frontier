import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createOctokit, getUserRepos } from "@/lib/github";
import { RepoList } from "@/components/repos/repo-list";

export default async function ReposPage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/");
  }

  const octokit = createOctokit(session.accessToken);
  const repos = await getUserRepos(octokit);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Repositories</h1>
        <p className="mt-2 text-muted-foreground">
          Select a repository to analyze its trajectory and find your next task.
        </p>
      </div>
      <RepoList repos={repos} />
    </div>
  );
}
