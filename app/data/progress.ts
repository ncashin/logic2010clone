import { AppStorage } from "#app/data/app-storage.ts";
import type { Problem, ProblemStatus, ProblemType } from "#app/data/problems.ts";
import { problemId } from "#app/data/problems.ts";
import { ProblemProgress, type ProblemProgressEntry } from "#app/data/schemas.ts";

const eventName = "logic2010:progress";

let storage = new AppStorage();

export type ProgressMap = Map<string, ProblemProgressEntry>;

export function emptyProgress(): ProblemProgressEntry {
  return { id: "", status: "unattempted", submitted: false };
}

export function progressFor(map: ProgressMap, problem: Problem) {
  return map.get(problemId(problem.type, problem.number)) ?? emptyProgress();
}

export async function listProgress(): Promise<ProgressMap> {
  let rows = await storage.getMany(ProblemProgress);
  return new Map(rows.map((row) => [row.id, row]));
}

export async function getProgress(type: ProblemType, number: string) {
  return storage.get(ProblemProgress, problemId(type, number));
}

let writes = new Map<string, Promise<void>>();

export async function writeProgress(
  type: ProblemType,
  number: string,
  patch: Partial<Pick<ProblemProgressEntry, "status" | "submitted" | "work" | "submission">>,
) {
  let id = problemId(type, number);
  let previous = writes.get(id) ?? Promise.resolve();
  let next = previous.catch(() => {}).then(async () => {
    let current = await storage.get(ProblemProgress, id);
    await storage.set(ProblemProgress, {
      id,
      status: current?.status ?? "unattempted",
      submitted: current?.submitted ?? false,
      work: current?.work,
      ...(current?.submission == null ? {} : { submission: current.submission }),
      ...patch,
    });
    window.dispatchEvent(new Event(eventName));
  });
  writes.set(id, next);
  return next;
}

export function watchProgress(onChange: () => void, signal: AbortSignal) {
  window.addEventListener(eventName, onChange);
  signal.addEventListener("abort", () => {
    window.removeEventListener(eventName, onChange);
  });
}

export { type ProblemStatus };