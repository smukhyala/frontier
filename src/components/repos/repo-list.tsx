"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RepoCard } from "./repo-card";
import { Search } from "lucide-react";

interface Repo {
  id: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  isPrivate: boolean;
  pushedAt: string | null;
}

export function RepoList({ repos }: { repos: Repo[] }) {
  const [search, setSearch] = useState("");

  const filtered = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (repo.language ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search
            ? "No repositories match your search."
            : "No repositories found."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((repo, index) => (
            <RepoCard key={repo.id} repo={repo} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
