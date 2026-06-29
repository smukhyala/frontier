import { Octokit } from "octokit";

export function createOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export async function getUserRepos(octokit: Octokit) {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "pushed",
    per_page: 100,
    type: "owner",
  });
  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    description: repo.description,
    language: repo.language,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
  }));
}

export async function getRepoInfo(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    stargazersCount: data.stargazers_count,
    forksCount: data.forks_count,
    openIssuesCount: data.open_issues_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    htmlUrl: data.html_url,
    topics: data.topics ?? [],
  };
}

export async function getRecentCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  count = 30
) {
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: count,
  });
  return data.map((commit) => ({
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message,
    author: commit.commit.author?.name ?? "Unknown",
    date: commit.commit.author?.date ?? "",
    filesChanged: (commit.files ?? []).map((f) => f.filename),
  }));
}

export async function getReadme(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export async function getOpenIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  count = 20
) {
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      per_page: count,
      sort: "updated",
    });
    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body?.slice(0, 500) ?? "",
        labels: issue.labels
          .map((l) => (typeof l === "string" ? l : l.name ?? ""))
          .filter(Boolean),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }));
  } catch {
    return [];
  }
}

export async function getRecentPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  count = 10
) {
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: count,
      sort: "updated",
      direction: "desc",
    });
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      mergedAt: pr.merged_at,
      createdAt: pr.created_at,
      body: pr.body?.slice(0, 300) ?? "",
    }));
  } catch {
    return [];
  }
}

export async function createGitHubIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[]
) {
  try {
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: labels ?? [],
    });
    return { success: true, url: data.html_url, number: data.number };
  } catch {
    // Retry without labels (they may not exist)
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
    });
    return { success: true, url: data.html_url, number: data.number };
  }
}
