interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  filesChanged: string[];
}

export interface FileActivity {
  path: string;
  editCount: number;
  firstSeen: string;
  lastEdited: string;
}

export interface AreaActivity {
  area: string;
  editCount: number;
  fileCount: number;
  recentFiles: string[];
}

export interface FileAnalysisResult {
  topFiles: FileActivity[];
  areas: AreaActivity[];
  hotspots: string[];
}

export function analyzeFileActivity(commits: CommitData[]): FileAnalysisResult {
  const fileStats = new Map<string, { count: number; first: string; last: string }>();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Count file edits
  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      const existing = fileStats.get(file);
      if (existing) {
        existing.count++;
        if (commit.date < existing.first) existing.first = commit.date;
        if (commit.date > existing.last) existing.last = commit.date;
      } else {
        fileStats.set(file, { count: 1, first: commit.date, last: commit.date });
      }
    }
  }

  // Top files by edit count
  const topFiles: FileActivity[] = [...fileStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([path, stats]) => ({
      path,
      editCount: stats.count,
      firstSeen: stats.first,
      lastEdited: stats.last,
    }));

  // Group by directory (2 levels deep)
  const areaMap = new Map<string, { files: Set<string>; count: number; recentFiles: string[] }>();
  for (const [file, stats] of fileStats) {
    const parts = file.split("/");
    const area = parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts.length > 1 ? parts[0] : "root";

    const existing = areaMap.get(area);
    if (existing) {
      existing.files.add(file);
      existing.count += stats.count;
      if (stats.last >= sevenDaysAgo) existing.recentFiles.push(file);
    } else {
      areaMap.set(area, {
        files: new Set([file]),
        count: stats.count,
        recentFiles: stats.last >= sevenDaysAgo ? [file] : [],
      });
    }
  }

  const areas: AreaActivity[] = [...areaMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([area, data]) => ({
      area,
      editCount: data.count,
      fileCount: data.files.size,
      recentFiles: data.recentFiles.slice(0, 5),
    }));

  // Hotspots: files edited 3+ times
  const hotspots = [...fileStats.entries()]
    .filter(([, stats]) => stats.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([path]) => path);

  return { topFiles, areas, hotspots };
}

// ── TODO/FIXME extraction ──

export interface TodoItem {
  file: string;
  line: string;
  type: "TODO" | "FIXME" | "HACK" | "XXX" | "TEMP";
}

export function extractTodos(
  codeSnippets: { path: string; content: string }[]
): TodoItem[] {
  const results: TodoItem[] = [];
  const pattern = /^.*\b(TODO|FIXME|HACK|XXX|TEMP)\b[:\s]*(.*)/gim;

  for (const snippet of codeSnippets) {
    for (const line of snippet.content.split("\n")) {
      const match = pattern.exec(line);
      if (match) {
        results.push({
          file: snippet.path,
          line: match[2]?.trim() || match[0].trim(),
          type: match[1].toUpperCase() as TodoItem["type"],
        });
      }
      pattern.lastIndex = 0;
    }
  }

  return results.slice(0, 20);
}
