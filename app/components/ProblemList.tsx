import { Search } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { Icon } from "#app/components/Icon.tsx";

import { routes } from "#app/routes.ts";
import { t } from "#app/theme.ts";

export type ProblemState = "solved" | "error" | "unsolved";

export interface Problem {
  number: string;
  problem: string;
  state: ProblemState;
}

export interface ProblemListProps {
  module: string;
  problems: Problem[];
  selected?: string;
}

const stateColor: Record<ProblemState, string> = {
  solved: "#008000",
  error: "#cc0000",
  unsolved: "#111827",
};

export function ProblemList(handle: Handle<ProblemListProps>) {
  let selected = handle.props.selected ?? handle.props.problems[0]?.number;
  let query = "";

  return () => {
    let { module, problems } = handle.props;
    let needle = query.trim().toLowerCase();
    let visible = needle
      ? problems.filter((problem) =>
          `${problem.number} ${problem.problem}`.toLowerCase().includes(needle),
        )
      : problems;

    return (
      <div
        mix={[
          css({
            display: "flex",
            flexDirection: "column",
            width: t.size.full,
            height: t.size.full,
            minHeight: "0",
          }),
        ]}
      >
      <div
        mix={[
          css({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: t.space.sm,
            flexShrink: "0",
            width: t.size.full,
            paddingInline: t.space.md,
            paddingBlock: t.space.xs,
            backgroundColor: t.surface.lvl0,
            color: t.colors.text.muted,
          }),
        ]}
      >
        <Icon icon={Search} mix={css({ width: t.space.xl, height: t.space.xl, flexShrink: "0" })} />
        <input
          type="text"
          placeholder="Search"
          aria-label="Search problems"
          value={query}
          mix={[
            on("input", (event) => {
              query = event.currentTarget.value;
              handle.update();
            }),
            css({
              flex: "1",
              width: "0",
              minWidth: "0",
              padding: 0,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              font: "inherit",
              color: t.colors.text.primary,
              "&::placeholder": { color: t.colors.text.muted },
            }),
          ]}
        />
      </div>
      <ul
        mix={[
          css({
            margin: 0,
            padding: 0,
            listStyle: "none",
            overflow: "auto",
            flex: "1",
            minHeight: "0",
          }),
        ]}
      >
        {visible.map((problem) => {
          let label =
            problem.state === "error" ? `${problem.number}Err` : problem.number;

          return (
            <li key={`${problem.number}:${problem.state}`}>
              <a
                href={routes.module.problem.href({ name: module, problem: problem.number })}
                data-rmx-src={routes.module.problemContent.href({
                  name: module,
                  problem: problem.number,
                })}
                data-rmx-target="module"
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
                    "&:hover": {
                      backgroundColor:
                        selected === problem.number ? "#c5d8f0" : "#e4eef8",
                    },
                  }),
                ]}
              >
                {label}: {problem.problem}
              </a>
            </li>
          );
        })}
      </ul>
      </div>
    );
  };
}
