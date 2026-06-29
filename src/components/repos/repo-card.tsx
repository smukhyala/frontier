"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, Lock, Globe } from "lucide-react";

interface RepoCardProps {
  repo: {
    name: string;
    owner: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stargazersCount: number;
    forksCount: number;
    isPrivate: boolean;
    pushedAt: string | null;
  };
  index: number;
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-400",
  Rust: "bg-orange-400",
  Go: "bg-cyan-400",
  Java: "bg-red-400",
  Ruby: "bg-red-500",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-400",
  C: "bg-gray-400",
  "C++": "bg-pink-400",
  "C#": "bg-green-500",
};

export function RepoCard({ repo, index }: RepoCardProps) {
  const pushedAgo = repo.pushedAt
    ? getTimeAgo(new Date(repo.pushedAt))
    : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link href={`/repos/${repo.owner}/${repo.name}`}>
        <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:bg-muted/30">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {repo.name}
                  </h3>
                  {repo.isPrivate ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {repo.description || "No description"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              {repo.language && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${languageColors[repo.language] ?? "bg-gray-400"}`}
                  />
                  {repo.language}
                </div>
              )}
              {repo.stargazersCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {repo.stargazersCount}
                </div>
              )}
              {repo.forksCount > 0 && (
                <div className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  {repo.forksCount}
                </div>
              )}
              <div className="ml-auto">
                <Badge variant="secondary" className="text-xs font-normal">
                  {pushedAgo}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
