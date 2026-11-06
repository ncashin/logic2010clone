import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { problemOnAssignment } from "#app/data/assignments.ts";
import type { Problem } from "#app/data/problems.ts";
import { getProgress, writeProgress } from "#app/data/progress.ts";
import { problemTypeName } from "#app/data/problems.ts";
import { sectionPadding } from "#app/components/Welcome.tsx";
import { t } from "#app/theme.ts";

const action = css({
  paddingInline: t.space.md,
  paddingBlock: t.space.xs,
  border: "none",
  borderRadius: t.radius.none,
  backgroundColor: "#e4eef8",
  color: t.colors.text.primary,
  font: "inherit",
  fontSize: t.fontSize.sm,
  lineHeight: t.lineHeight.normal,
  cursor: "pointer",
  "&:hover": { backgroundColor: "#c5d8f0" },
});

export interface ProblemWorkspaceProps {
  problem: Problem;
}

export function ProblemWorkspace(handle: Handle<ProblemWorkspaceProps>) {
  let loaded = "";
  let work = "";
  let notice = "";
  let dirty = false;

  handle.queueTask(() => {
    void restore(handle.props.problem);
  });
  handle.signal.addEventListener("abort", () => {
    if (dirty) void persist();
  });

  async function restore(problem: Problem) {
    let saved = await getProgress(problem.type, problem.number);
    if (
      dirty ||
      handle.props.problem.number !== problem.number ||
      handle.props.problem.type !== problem.type
    ) {
      return;
    }
    loaded = `${problem.type}:${problem.number}`;
    work = saved?.work ?? "";
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    let { problem } = handle.props;
    return writeProgress(problem.type, problem.number, {
      status: status ?? (work.trim() ? "in-progress" : "unattempted"),
      work,
      ...(submitted == null ? {} : { submitted }),
    });
  }

  function saveChange(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    dirty = true;
    void persist(status, submitted);
    handle.update();
  }

  return () => {
    let { problem } = handle.props;
    let key = `${problem.type}:${problem.number}`;
    if (loaded !== key) {
      loaded = key;
      work = "";
      notice = "";
      dirty = false;
      void restore(problem);
    }

    return (
      <div
        mix={css({
          width: t.size.full,
          ...sectionPadding,
        })}
      >
        <div
          mix={css({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: t.space.md,
            paddingBottom: t.space.md,
          })}
        >
          <h2
            mix={css({
              margin: 0,
              flex: "1",
              minWidth: "0",
              fontSize: t.fontSize.md,
              fontWeight: t.fontWeight.normal,
            })}
          >
            {problemTypeName(problem.type)} {problem.number}: {problem.problem}
          </h2>
          <div mix={css({ display: "flex", flexShrink: "0", flexDirection: "row", gap: t.space.sm })}>
            <button
              type="button"
              mix={[
                action,
                on("click", () => {
                  notice = work.trim() ? "Checked: complete." : "Checked: incomplete.";
                  saveChange(work.trim() ? "correct" : "incorrect");
                }),
              ]}
            >
              Check
            </button>
            {problemOnAssignment(problem.type, problem.number) ? (
              <button
                type="button"
                mix={[
                  action,
                  on("click", () => {
                    if (!work.trim()) {
                      notice = "Submit needs an answer.";
                      handle.update();
                      return;
                    }
                    notice = "Submitted.";
                    saveChange("correct", true);
                  }),
                ]}
              >
                Submit
              </button>
            ) : null}
          </div>
        </div>
        <textarea
          value={work}
          placeholder="Work"
          mix={[
            on("input", (event) => {
              work = event.currentTarget.value;
              saveChange();
            }),
            css({
              display: "block",
              width: t.size.full,
              minHeight: t.layout.block,
              padding: t.space.md,
              borderWidth: t.space.px,
              borderStyle: "solid",
              borderColor: t.colors.border.default,
              backgroundColor: t.surface.lvl0,
              color: t.colors.text.primary,
              font: "inherit",
              fontSize: t.fontSize.md,
              lineHeight: t.lineHeight.normal,
            }),
          ]}
        />
        {notice ? (
          <p mix={css({ marginTop: t.space.md, fontSize: t.fontSize.sm })}>{notice}</p>
        ) : null}
      </div>
    );
  };
}
