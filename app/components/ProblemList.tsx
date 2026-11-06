import { Circle, CircleCheck, Search } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { Icon } from "#app/components/Icon.tsx";
import { problemOnAssignment } from "#app/data/assignments.ts";
import {
  type Problem,
  type ProblemStatus,
  problemId,
  problemLabel,
} from "#app/data/problems.ts";
import { listProgress, progressFor, type ProgressMap, watchProgress } from "#app/data/progress.ts";
import { routes } from "#app/routes.ts";
import { t } from "#app/theme.ts";

export type { Problem, ProblemStatus };

export interface ProblemListProps {
  problems: Problem[];
  selected?: string;
  selectionNonce?: number;
  label?: "statement" | "typed";
  chapters?: boolean;
  href?: (problem: Problem) => string;
  content?: (problem: Problem) => string;
}

const stateColor: Record<ProblemStatus, string> = {
  correct: "#008000",
  incorrect: "#cc0000",
  "in-progress": "#ca8a04",
  unattempted: "#111827",
};

export function ProblemList(handle: Handle<ProblemListProps>) {
  let selected = handle.props.selected;
  let selectionNonce = handle.props.selectionNonce;
  let query = "";
  let progress: ProgressMap = new Map();

  handle.queueTask(() => {
    void refresh();
  });
  watchProgress(() => {
    void refresh();
  }, handle.signal);

  async function refresh() {
    progress = await listProgress();
    handle.update();
  }

  return () => {
    let { problems } = handle.props;
    if (handle.props.selectionNonce !== selectionNonce) {
      selectionNonce = handle.props.selectionNonce;
      selected = handle.props.selected;
    }
    if (selected == null && problems[0]) selected = problemId(problems[0].type, problems[0].number);
    let needle = query.trim().toLowerCase();
    let visible = needle
      ? problems.filter((problem) =>
          `${problemLabel(problem, "typed")} ${problem.number} ${problem.problem}`
            .toLowerCase()
            .includes(needle),
        )
      : problems;
    let chapters: { chapter: string; problems: Problem[] }[] = [];
    for (let problem of visible) {
      let chapter = problem.number.split(".")[0] ?? problem.number;
      let group = chapters.find((item) => item.chapter === chapter);
      if (group) group.problems.push(problem);
      else chapters.push({ chapter, problems: [problem] });
    }

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
              paddingBlock: t.space.xs,
              color: t.colors.text.primary,
              "&::placeholder": { color: t.colors.text.muted },
            }),
          ]}
        />
      </div>
      <div
        mix={[
          css({
            overflow: "auto",
            flex: "1",
            minHeight: "0",
          }),
        ]}
      >
        {chapters.map((group) => (
          <section key={group.chapter}>
            {handle.props.chapters === false ? null : (
            <h2
              mix={css({
                position: "sticky",
                top: "0",
                zIndex: "1",
                margin: 0,
                paddingInline: t.space.md,
                paddingBlock: t.space.xs,
                backgroundColor: t.surface.lvl2,
                color: t.colors.text.primary,
                fontSize: t.fontSize.sm,
                fontWeight: t.fontWeight.semibold,
                lineHeight: t.lineHeight.normal,
              })}
            >
              Chapter {group.chapter}
            </h2>
            )}
            <ul
              mix={css({
                margin: 0,
                padding: 0,
                listStyle: "none",
              })}
            >
              {group.problems.map((problem) => {
                let key = problemId(problem.type, problem.number);
                let record = progressFor(progress, problem);
                let onAssignment = problemOnAssignment(problem.type, problem.number);
                let points = problem.points ?? (onAssignment ? 1 : undefined);
                let href =
                  handle.props.href?.(problem) ??
                  routes.module.problem.href({ name: problem.type, problem: problem.number });

                return (
                  <li key={key}>
                    <a
                      href={href}
                      data-rmx-src={
                        handle.props.content?.(problem) ??
                        routes.module.problemContent.href({
                          name: problem.type,
                          problem: problem.number,
                        })
                      }
                      data-rmx-target="module"
                      mix={[
                        on("click", () => {
                          selected = key;
                          handle.update();
                        }),
                        css({
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: t.space.sm,
                          width: t.size.full,
                          paddingInline: t.space.md,
                          paddingBlock: t.space.xs,
                          border: "none",
                          textAlign: "left",
                          font: "inherit",
                          color: stateColor[record.status],
                          backgroundColor: selected === key ? "#c5d8f0" : "transparent",
                          textDecoration: "none",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: selected === key ? "#c5d8f0" : "#e4eef8",
                          },
                        }),
                      ]}
                    >
                      <span mix={css({ minWidth: "0" })}>
                        {problemLabel(problem, handle.props.label ?? "statement")}
                      </span>
                      <span
                        mix={css({
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: t.space.sm,
                          marginLeft: "auto",
                          flexShrink: "0",
                        })}
                      >
                        {points != null ? (
                          <span
                            mix={css({
                              color: t.colors.text.muted,
                            })}
                          >
                            {record.submitted ? points : 0}/{points}
                            {points === 1 ? "pt" : "pts"}
                          </span>
                        ) : null}
                        {onAssignment ? (
                          <Icon
                            icon={record.submitted ? CircleCheck : Circle}
                            mix={css({
                              width: t.fontSize.xl,
                              height: t.fontSize.xl,
                              flexShrink: "0",
                              color: record.submitted ? stateColor.correct : t.colors.text.muted,
                            })}
                          />
                        ) : null}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      </div>
    );
  };
}
