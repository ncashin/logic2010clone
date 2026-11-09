import { AppStorage } from "#app/data/app-storage.ts";
import type { Problem, ProblemStatus, ProblemType } from "#app/data/problems.ts";
import { problemId } from "#app/data/problems.ts";
import { ProblemProgress, type ProblemProgressEntry } from "#app/data/schemas.ts";

const eventName = "logic2010:progress";

let storage = new AppStorage();
let memory = new Map<string, ProblemProgressEntry>();

export type ProgressMap = Map<string, ProblemProgressEntry>;

export function peekProgress(type: ProblemType, number: string) {
  return memory.get(problemId(type, number));
}

export function emptyProgress(): ProblemProgressEntry {
  return { id: "", status: "unattempted", submitted: false };
}

export function progressFor(map: ProgressMap, problem: Problem) {
  return map.get(problemId(problem.type, problem.number)) ?? emptyProgress();
}

export async function listProgress(): Promise<ProgressMap> {
  let rows = await storage.getMany(ProblemProgress);
  for (let row of rows) memory.set(row.id, row);
  return new Map(rows.map((row) => [row.id, row]));
}

export async function getProgress(type: ProblemType, number: string) {
  let row = await storage.get(ProblemProgress, problemId(type, number));
  if (row) memory.set(row.id, row);
  return row;
}

let writes = new Map<string, Promise<void>>();

export async function writeProgress(
  type: ProblemType,
  number: string,
  patch: Partial<Pick<ProblemProgressEntry, "status" | "submitted" | "work" | "submission">>,
) {
  let id = problemId(type, number);
  let known = memory.get(id);
  memory.set(id, {
    id,
    status: patch.status ?? known?.status ?? "unattempted",
    submitted: patch.submitted ?? known?.submitted ?? false,
    work: patch.work ?? known?.work,
    ...(patch.submission != null
      ? { submission: patch.submission }
      : known?.submission == null
        ? {}
        : { submission: known.submission }),
  });
  let previous = writes.get(id) ?? Promise.resolve();
  let next = previous.catch(() => {}).then(async () => {
    let current = await storage.get(ProblemProgress, id);
    let next = {
      id,
      status: current?.status ?? "unattempted",
      submitted: current?.submitted ?? false,
      work: current?.work,
      ...(current?.submission == null ? {} : { submission: current.submission }),
      ...patch,
    };
    memory.set(id, next);
    await storage.set(ProblemProgress, next);
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