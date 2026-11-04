import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { t } from "#app/theme.ts";

export type ProblemState = "solved" | "error" | "unsolved";

export interface Problem {
  number: string;
  problem: string;
  state: ProblemState;
}

export interface ProblemListProps {
  problems: Problem[];
}

const stateColor: Record<ProblemState, string> = {
  solved: "#008000",
  error: "#cc0000",
  unsolved: "#111827",
};

export function ProblemList(handle: Handle<ProblemListProps>) {
  let selected = handle.props.problems[0]?.number;

  return () => {
    let { problems } = handle.props;

    return (
      <ul
        mix={[
          css({
            margin: 0,
            padding: 0,
            listStyle: "none",
          }),
        ]}
      >
        {problems.map((problem) => {
          let label =
            problem.state === "error" ? `${problem.number}Err` : problem.number;

          return (
            <li key={`${problem.number}:${problem.state}`}>
              <button
                type="button"
                mix={[
                  on("click", () => {
                    selected = problem.number;
                    handle.update();
                  }),
                  css({
                    display: "block",
                    width: t.size.full,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.xs,
                    border: "none",
                    textAlign: "left",
                    font: "inherit",
                    color: stateColor[problem.state],
                    backgroundColor:
                      selected === problem.number ? "#c5d8f0" : "transparent",
                    cursor: "pointer",
                  }),
                ]}
              >
                {label}: {problem.problem}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };
}
