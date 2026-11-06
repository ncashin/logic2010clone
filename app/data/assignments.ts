import { findProblem, type Problem, type ProblemType } from "#app/data/problems.ts";

export interface AssignmentProblemRef {
  type: ProblemType;
  number: string;
}

export const assignmentProblems: Record<string, AssignmentProblemRef[]> = {
  "assignment-1": [
    { type: "derivation", number: "1.001" },
    { type: "recognizing-rules", number: "1.0001" },
  ],
  "assignment-2": [
    { type: "derivation", number: "1.002" },
    { type: "parsing", number: "1.0002" },
  ],
  "assignment-3": [
    { type: "symbolization", number: "1.001" },
    { type: "truth-tables", number: "1.003" },
  ],
  "assignment-4": [
    { type: "invalidity", number: "1.004" },
    { type: "recognizing-rules", number: "1.001" },
  ],
  "assignment-5": [
    { type: "derivation", number: "1.004" },
    { type: "parsing", number: "1.0004" },
  ],
  "assignment-6": [
    { type: "symbolization", number: "1.002" },
    { type: "truth-tables", number: "1.0001" },
  ],
};

export function assignmentProblemList(slug: string | undefined): Problem[] {
  if (!slug) return [];
  return (assignmentProblems[slug] ?? [])
    .map((item) => findProblem(item.type, item.number))
    .filter((problem): problem is Problem => problem != null);
}
