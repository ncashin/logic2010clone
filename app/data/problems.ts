export const problemTypes = [
  { slug: "derivation", name: "Derivation" },
  { slug: "invalidity", name: "Invalidity" },
  { slug: "parsing", name: "Parsing" },
  { slug: "recognizing-rules", name: "Recognizing Rules" },
  { slug: "symbolization", name: "Symbolization" },
  { slug: "truth-tables", name: "Truth Tables" },
] as const;

export type ProblemType = (typeof problemTypes)[number]["slug"];

export type ProblemStatus = "unattempted" | "in-progress" | "incorrect" | "correct";

export interface Problem {
  type: ProblemType;
  number: string;
  problem: string;
}

export const problems: Problem[] = [
  { type: "derivation", number: "1.0001", problem: "~P. Q → P ∴ ~Q" },
  { type: "derivation", number: "1.0002", problem: "~~(P → Q). P ∴ Q" },
  { type: "derivation", number: "1.0003", problem: "P. R → ~Q. P → Q ∴ ~R" },
  { type: "derivation", number: "1.0004", problem: "P → (Q → R). (Q → R) → S. ~S ∴ ~P" },
  { type: "derivation", number: "1.001", problem: "~Q ∴ (P → Q) → ~P" },
  { type: "derivation", number: "1.001EG1", problem: "~Q ∴ (P → Q) → ~P" },
  { type: "derivation", number: "1.001EG2", problem: "~Q ∴ (P → Q) → ~P" },
  { type: "derivation", number: "1.002", problem: "P → Q. Q → R ∴ P → R" },
  { type: "derivation", number: "1.002EG1", problem: "P → Q. Q → R ∴ P → R" },
  { type: "derivation", number: "1.002EG2", problem: "P → Q. Q → R ∴ P → R" },
  { type: "derivation", number: "1.003", problem: "R → Q. R → ~Q ∴ ~R" },
  { type: "derivation", number: "1.004", problem: "P → ~Q. R → Q ∴ P → ~R" },
  { type: "derivation", number: "1.004EG1", problem: "P → ~Q. R → Q ∴ P → ~R" },
  { type: "invalidity", number: "1.0001", problem: "P → Q. Q ∴ P" },
  { type: "invalidity", number: "1.0002", problem: "P ∨ Q. ~P ∴ ~Q" },
  { type: "invalidity", number: "1.004", problem: "P → Q. ~P ∴ ~Q" },
  { type: "parsing", number: "1.0001", problem: "(P → Q) → R" },
  { type: "parsing", number: "1.0002", problem: "~(P ∨ Q) → R" },
  { type: "parsing", number: "1.0004", problem: "P → (Q ∧ ~R)" },
  { type: "recognizing-rules", number: "1.0001", problem: "P → Q. P ∴ Q" },
  { type: "recognizing-rules", number: "1.0002", problem: "P → Q. ~Q ∴ ~P" },
  { type: "recognizing-rules", number: "1.001", problem: "P ∨ Q. ~P ∴ Q" },
  { type: "symbolization", number: "1.0001", problem: "If P then Q, and R." },
  { type: "symbolization", number: "1.001", problem: "Neither P nor Q." },
  { type: "symbolization", number: "1.002", problem: "P only if Q." },
  { type: "truth-tables", number: "1.0001", problem: "P → Q" },
  { type: "truth-tables", number: "1.0002", problem: "P ∧ ~Q" },
  { type: "truth-tables", number: "1.003", problem: "(P ∨ Q) → R" },
];

export function problemId(type: string, number: string) {
  return `${type}:${number}`;
}

export function problemTypeName(type: ProblemType) {
  return problemTypes.find((item) => item.slug === type)?.name ?? type;
}

export function problemsForType(type: string) {
  return problems.filter((problem) => problem.type === type);
}

export function findProblem(type: string, number: string) {
  return problems.find((problem) => problem.type === type && problem.number === number);
}

export function problemLabel(problem: Problem, style: "statement" | "typed" = "statement") {
  if (style === "typed") return `${problemTypeName(problem.type)} ${problem.number}`;
  return `${problem.number}: ${problem.problem}`;
}
