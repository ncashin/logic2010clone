import { findProblem, type Problem, type ProblemType } from "#app/data/problems.ts";

export interface AssignmentProblemRef {
  type: ProblemType;
  number: string;
}

export const assignmentProblems: Record<string, AssignmentProblemRef[]> = {
  "assignment-1": [
    { type: "parsing", number: "1.001" },
    { type: "parsing", number: "1.002" },
    { type: "parsing", number: "1.003" },
    { type: "parsing", number: "1.004" },
    { type: "parsing", number: "1.005" },
    { type: "parsing", number: "1.006" },
    { type: "parsing", number: "1.007" },
    { type: "parsing", number: "1.008" },
    { type: "parsing", number: "1.009" },
    { type: "parsing", number: "1.010" },
    { type: "symbolization", number: "1.001" },
    { type: "symbolization", number: "1.002" },
    { type: "symbolization", number: "1.003" },
    { type: "symbolization", number: "1.004" },
    { type: "symbolization", number: "1.005" },
    { type: "symbolization", number: "1.006" },
    { type: "symbolization", number: "1.007" },
    { type: "symbolization", number: "1.008" },
    { type: "symbolization", number: "1.009" },
    { type: "symbolization", number: "1.010" },
  ],
  "assignment-2": [
    { type: "recognizing-rules", number: "1.001" },
    { type: "recognizing-rules", number: "1.002" },
    { type: "recognizing-rules", number: "1.003" },
    { type: "recognizing-rules", number: "1.004" },
    { type: "recognizing-rules", number: "1.005" },
    { type: "recognizing-rules", number: "1.006" },
    { type: "recognizing-rules", number: "1.007" },
    { type: "recognizing-rules", number: "1.008" },
    { type: "recognizing-rules", number: "1.009" },
    { type: "recognizing-rules", number: "1.010" },
    { type: "derivation", number: "1.0001" },
    { type: "derivation", number: "1.0002" },
    { type: "derivation", number: "1.0003" },
    { type: "derivation", number: "1.0004" },
    { type: "derivation", number: "1.005" },
  ],
  "assignment-3": [
    { type: "symbolization", number: "1.028a" },
    { type: "symbolization", number: "1.028b" },
    { type: "symbolization", number: "1.029a" },
    { type: "symbolization", number: "1.029b" },
    { type: "derivation", number: "1.012" },
    { type: "derivation", number: "1.014" },
    { type: "derivation", number: "1.018" },
    { type: "derivation", number: "1.028" },
    { type: "derivation", number: "1.034" },
    { type: "derivation", number: "1.036" },
    { type: "derivation", number: "1.040" },
    { type: "derivation", number: "1.113 T13" },
    { type: "derivation", number: "1.118 T18" },
  ],
  "assignment-4": [
    { type: "parsing", number: "2.001" },
    { type: "parsing", number: "2.002" },
    { type: "parsing", number: "2.003" },
    { type: "parsing", number: "2.004" },
    { type: "parsing", number: "2.005" },
    { type: "symbolization", number: "2.036" },
    { type: "symbolization", number: "2.037" },
    { type: "symbolization", number: "2.038" },
    { type: "symbolization", number: "2.039" },
    { type: "symbolization", number: "2.040" },
    { type: "recognizing-rules", number: "2.011" },
    { type: "recognizing-rules", number: "2.012" },
    { type: "recognizing-rules", number: "2.013" },
    { type: "recognizing-rules", number: "2.014" },
    { type: "recognizing-rules", number: "2.015" },
  ],
  "assignment-5": [
    { type: "derivation", number: "2.00b" },
    { type: "derivation", number: "2.00c" },
    { type: "derivation", number: "2.00d" },
    { type: "derivation", number: "2.00e" },
    { type: "derivation", number: "2.00f" },
    { type: "derivation", number: "2.040 T40" },
    { type: "derivation", number: "2.045 T45" },
    { type: "derivation", number: "2.065 T65" },
    { type: "derivation", number: "2.066 T66" },
    { type: "symbolization", number: "2.086" },
    { type: "symbolization", number: "2.087" },
    { type: "symbolization", number: "2.088" },
    { type: "symbolization", number: "2.089" },
    { type: "symbolization", number: "2.090" },
  ],
  "assignment-6": [
    { type: "derivation", number: "2.010" },
    { type: "derivation", number: "2.015" },
    { type: "derivation", number: "2.016" },
    { type: "derivation", number: "2.019" },
    { type: "derivation", number: "2.023" },
    { type: "derivation", number: "2.090 T90" },
    { type: "symbolization", number: "2.118" },
    { type: "symbolization", number: "2.119" },
    { type: "symbolization", number: "2.120" },
    { type: "symbolization", number: "2.121" },
    { type: "truth-tables", number: "2.027" },
    { type: "truth-tables", number: "2.028" },
    { type: "truth-tables", number: "2.029" },
    { type: "truth-tables", number: "2.030" },
    { type: "truth-tables", number: "2.006" },
    { type: "truth-tables", number: "2.007" },
    { type: "truth-tables", number: "2.008" },
    { type: "truth-tables", number: "2.009" },
  ],
};

export function assignmentProblemList(slug: string | undefined): Problem[] {
  if (!slug) return [];
  return (assignmentProblems[slug] ?? [])
    .map((item) => {
      let problem = findProblem(item.type, item.number);
      return problem ? { ...problem, points: 1 } : null;
    })
    .filter((problem): problem is Problem => problem != null);
}

export function problemOnAssignment(type: string, number: string) {
  return Object.values(assignmentProblems).some(
    (items) => items.some((item) => item.type === type && item.number === number),
  );
}
