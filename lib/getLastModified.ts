import { statSync } from "fs";
import { spawnSync } from "child_process";

export function getLastModified(filePath: string): Date {
  const resolved = filePath.startsWith("file://")
    ? filePath.slice(7)
    : filePath;

  try {
    const proc = spawnSync("git", ["log", "-1", "--format=%cI", "--", resolved], {
      encoding: "utf-8",
    });
    const gitDate = proc.stdout.trim();
    if (gitDate) return new Date(gitDate);
  } catch {}

  return statSync(resolved).mtime;
}