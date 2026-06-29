"use client";

import { Badge } from "@/components/ui/badge";
import { Star, GitFork, CircleDot, ExternalLink } from "lucide-react";

interface RepoHeaderProps {
  repo: {
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stargazersCount: number;
    forksCount: number;
    openIssuesCount: number;
    htmlUrl: string;
    topics: string[];
  };
}

export function RepoHeader({ repo }: RepoHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{repo.fullName}</h1>
          {repo.description && (
            <p className="mt-2 text-muted-foreground text-lg">
              {repo.description}
            </p>
          )}
        </div>
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-primary/60" />
            {repo.language}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          {repo.stargazersCount}
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="h-4 w-4" />
          {repo.forksCount}
        </div>
        <div className="flex items-center gap-1">
          <CircleDot className="h-4 w-4" />
          {repo.openIssuesCount} issues
        </div>
      </div>

      {repo.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {repo.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
