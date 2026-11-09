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

function sectionId(number: string) {
  let [chapter, rest = ""] = number.split(".");
  let digits = /^\d+/.exec(rest)?.[0] ?? "";
  if (digits.length <= 2) return `${chapter}.${digits}`;
  return `${chapter}.${digits.slice(0, -1)}`;
}

function sectionLabel(problems: Problem[]) {
  let stems = [
    ...new Set(
      problems.map((problem) => {
        let [chapter, rest = ""] = problem.number.split(".");
        let digits = /^\d+/.exec(rest)?.[0] ?? "";
        return `${chapter}.${digits}`;
      }),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  let first = stems[0];
  let last = stems[stems.length - 1];
  if (first == null || last == null || first === last) return first ?? "";
  return `${first}–${last}`;
}

function sectionBlurb(problems: Problem[]) {
  let type = problems[0]?.type;
  let blob = problems.map((problem) => problem.problem).join(" ");
  let topic = topicPhrase(blob);
  if (type === "symbolization") return `Sentences to symbolize, ${topic}`;
  if (type === "parsing") return `Formulas to parse, ${topic}`;
  if (type === "recognizing-rules") return `Name the rule used, ${topic}`;
  if (type === "truth-tables") return `Truth tables, ${topic}`;
  if (type === "invalidity") return `Show the argument is invalid, ${topic}`;
  let theorems = problems.every(
    (problem) => /^\s*\.:/.test(problem.problem) || / T\d/.test(problem.number),
  );
  let short = problems.every((problem) => (/^\d+/.exec(problem.number.split(".")[1] ?? "")?.[0].length ?? 0) >= 4);
  let kind = theorems ? "Theorems to derive" : short ? "Short derivations" : "Derivations";
  return `${kind}, ${topic}`;
}

function topicPhrase(blob: string) {
  if (blob.includes("%")) return "using definite descriptions";
  if (blob.includes("=") || blob.includes("<>")) return "using identity";
  if (blob.includes("@") || blob.includes("!")) return "using quantifiers";
  if (blob.includes("?NOV") || blob.includes("?DNF") || blob.includes("?CNF")) return "into normal form";
  if (blob.includes("&") || blob.includes("|") || blob.includes("<->")) {
    return "using conjunction, disjunction, and the biconditional";
  }
  if (blob.includes("->") || blob.includes("~")) return "using negation and the conditional";
  return "in ordinary language";
}

/** One-line chapter header: 14px type at 1.5 line height, 12px padding above, 2px below. */
const chapterHeaderOffset = "35px";

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
    let chapters: {
      chapter: string;
      sections: { id: string; label: string; blurb: string; problems: Problem[] }[];
    }[] = [];
    for (let problem of visible) {
      let chapter = problem.number.split(".")[0] ?? problem.number;
      let id = sectionId(problem.number);
      let group = chapters.find((item) => item.chapter === chapter);
      if (!group) {
        group = { chapter, sections: [] };
        chapters.push(group);
      }
      let section = group.sections.find((item) => item.id === id);
      if (section) section.problems.push(problem);
      else group.sections.push({ id, label: "", blurb: "", problems: [problem] });
    }
    for (let group of chapters) {
      let merged: typeof group.sections = [];
      for (let section of group.sections) {
        section.label = sectionLabel(section.problems);
        section.blurb = sectionBlurb(section.problems);
        let previous = merged[merged.length - 1];
        if (previous && previous.blurb === section.blurb) {
          previous.problems.push(...section.problems);
          previous.label = sectionLabel(previous.problems);
        } else {
          merged.push(section);
        }
      }
      group.sections = merged;
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
                zIndex: "2",
                margin: 0,
                paddingInline: t.space.md,
                paddingTop: t.space.lg,
                paddingBottom: t.space.sm,
                backgroundColor: t.colors.choice.faceHover,
                color: t.colors.text.primary,
                fontSize: t.fontSize.sm,
                fontWeight: t.fontWeight.semibold,
                lineHeight: t.lineHeight.normal,
              })}
            >
              Chapter {group.chapter}
            </h2>
            )}
            {group.sections.map((section) => (
            <div key={section.id}>
            {handle.props.chapters === false ? null : (
            <h3
              mix={css({
                position: "sticky",
                top: chapterHeaderOffset,
                zIndex: "1",
                margin: 0,
                paddingInline: t.space.md,
                paddingBlock: t.space.xs,
                backgroundColor: t.colors.choice.faceHover,
                color: t.colors.text.primary,
                fontSize: t.fontSize.sm,
                fontWeight: t.fontWeight.normal,
                lineHeight: t.lineHeight.normal,
              })}
            >
              {section.label}
              <span
                mix={css({
                  display: "block",
                  color: t.colors.text.muted,
                  fontSize: t.fontSize.xs,
                  fontWeight: t.fontWeight.normal,
                  letterSpacing: t.letterSpacing.normal,
                })}
              >
                {section.blurb}
              </span>
            </h3>
            )}
            <ul
              mix={css({
                margin: 0,
                padding: 0,
                listStyle: "none",
              })}
            >
              {section.problems.map((problem) => {
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
            </div>
            ))}
          </section>
        ))}
      </div>
      </div>
    );
  };
}
