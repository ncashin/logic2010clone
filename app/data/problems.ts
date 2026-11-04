import type { Problem } from "#app/components/ProblemList.tsx";

export const problems: Problem[] = [
  { number: "1.0001", problem: "~P. Q → P ∴ ~Q", state: "solved" },
  { number: "1.0002", problem: "~~(P → Q). P ∴ Q", state: "solved" },
  { number: "1.0003", problem: "P. R → ~Q. P → Q ∴ ~R", state: "solved" },
  { number: "1.0004", problem: "P → (Q → R). (Q → R) → S. ~S ∴ ~P", state: "solved" },
  { number: "1.001", problem: "~Q ∴ (P → Q) → ~P", state: "solved" },
  { number: "1.001EG1", problem: "~Q ∴ (P → Q) → ~P", state: "solved" },
  { number: "1.001EG2", problem: "~Q ∴ (P → Q) → ~P", state: "solved" },
  { number: "1.002", problem: "P → Q. Q → R ∴ P → R", state: "solved" },
  { number: "1.002EG1", problem: "P → Q. Q → R ∴ P → R", state: "solved" },
  { number: "1.002EG2", problem: "P → Q. Q → R ∴ P → R", state: "solved" },
  { number: "1.003", problem: "R → Q. R → ~Q ∴ ~R", state: "error" },
  { number: "1.004", problem: "P → ~Q. R → Q ∴ P → ~R", state: "solved" },
  { number: "1.004EG1", problem: "P → ~Q. R → Q ∴ P → ~R", state: "solved" },
];

export function findProblem(number: string) {
  return problems.find((problem) => problem.number === number);
}
