import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { problemOnAssignment } from "#app/data/assignments.ts";
import type { Problem } from "#app/data/problems.ts";
import { getProgress, writeProgress } from "#app/data/progress.ts";
import { sectionPadding } from "#app/components/Welcome.tsx";
import { formatFormula, parseArgument, recognizeRule } from "#app/logic/derivation.ts";
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

const resetAction = css({
  backgroundColor: t.colors.action.danger.background,
  color: t.colors.action.danger.foreground,
  "&:hover": { backgroundColor: t.colors.action.danger.backgroundHover },
});

const submitAction = css({
  backgroundColor: "#16a34a",
  color: "#ffffff",
  "&:hover": { backgroundColor: "#15803d" },
});

const rules = [
  { name: "mp", symbols: "P  P→Q  ∴  Q", help: "From P and P→Q, get Q." },
  { name: "mt", symbols: "~Q  P→Q  ∴  ~P", help: "From ~Q and P→Q, get ~P." },
  { name: "dn", symbols: "~~P  ∴  P", help: "Add or cancel a double not on the whole line." },
  { name: "None", symbols: "", help: "No one of those rules gives the last line." },
];

export interface RecognizingRulesProps {
  problem: Problem;
}

function argumentLines(problem: string) {
  let parsed = parseArgument(problem);
  if (typeof parsed !== "string") {
    return {
      premises: parsed.premises.map((formula) => formatFormula(formula)),
      conclusion: formatFormula(parsed.conclusion),
    };
  }
  let parts = problem.split(".:");
  let conclusion = parts[1]?.trim();
  if (!conclusion) return null;
  return {
    premises: (parts[0] ?? "")
      .split(".")
      .map((piece) => piece.trim())
      .filter((piece) => piece !== ""),
    conclusion,
  };
}

function normalize(answer: string) {
  return answer.trim().toLowerCase();
}

export function RecognizingRules(handle: Handle<RecognizingRulesProps>) {
  let loaded = "";
  let answer = "";
  let notice = "";
  let dirty = false;
  let helpOpen = false;
  let submitted = false;

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
    answer = saved?.work ?? "";
    submitted = saved?.submitted ?? false;
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    let { problem } = handle.props;
    return writeProgress(problem.type, problem.number, {
      status: status ?? (answer.trim() ? "in-progress" : "unattempted"),
      work: answer,
      ...(submitted == null ? {} : { submitted }),
    });
  }

  function saveChange(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    dirty = true;
    void handle.update().then((signal) => {
      if (signal.aborted) return;
      void persist(status, submitted);
    });
  }

  return () => {
    let { problem } = handle.props;
    let key = `${problem.type}:${problem.number}`;
    if (loaded !== key) {
      loaded = key;
      answer = "";
      notice = "";
      dirty = false;
      helpOpen = false;
      submitted = false;
      void restore(problem);
    }

    let lines = argumentLines(problem.problem);
    let expected = recognizeRule(problem.problem);
    let given = normalize(answer);
    let correct = given !== "" && given === expected;

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
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: t.space.md,
            paddingBottom: t.space.md,
          })}
        >
          <h2
            mix={css({
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "1.25em",
              margin: 0,
              flex: "1",
              minWidth: "0",
              color: t.colors.text.primary,
              fontSize: t.fontSize.md,
              fontWeight: t.fontWeight.normal,
              lineHeight: t.lineHeight.normal,
            })}
          >
            <span
              mix={css({
                alignSelf: "flex-start",
                color: t.colors.text.secondary,
                fontSize: t.fontSize.lg,
                whiteSpace: "nowrap",
              })}
            >
              Recognizing Rules {problem.number}
            </span>
          </h2>
          <div
            mix={css({
              position: "relative",
              display: "flex",
              flexShrink: "0",
              flexDirection: "row",
              gap: t.space.sm,
            })}
          >
            <div mix={css({ position: "relative", display: "flex" })}>
              <button
                type="button"
                mix={[
                  action,
                  on("click", () => {
                    helpOpen = !helpOpen;
                    handle.update();
                  }),
                ]}
              >
                Help
              </button>
              {helpOpen ? (
                <div
                  mix={css({
                    position: "absolute",
                    top: "100%",
                    right: "0px",
                    zIndex: "2",
                    width: "24rem",
                    marginTop: t.space.sm,
                    padding: t.space.lg,
                    backgroundColor: t.surface.lvl0,
                    boxShadow: t.shadow.md,
                    fontSize: t.fontSize.sm,
                    lineHeight: t.lineHeight.normal,
                  })}
                >
                  {rules.map((rule) => (
                    <div
                      key={rule.name}
                      mix={css({
                        display: "grid",
                        gridTemplateColumns: "9rem 1fr",
                        gap: t.space.sm,
                        paddingBlock: t.space.xs,
                      })}
                    >
                      <div>
                        <div mix={css({ color: t.colors.text.secondary })}>{rule.name}</div>
                        {rule.symbols ? (
                          <div mix={css({ color: t.colors.text.muted })}>{rule.symbols}</div>
                        ) : null}
                      </div>
                      <div>{rule.help}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              mix={[
                action,
                on("click", () => {
                  if (typeof expected !== "string" || !["mp", "mt", "dn", "none"].includes(expected)) {
                    notice = expected;
                    handle.update();
                    return;
                  }
                  notice = correct ? "Checked: correct." : "Checked: incorrect.";
                  saveChange(correct ? "correct" : "incorrect");
                }),
              ]}
            >
              Check
            </button>
            <button
              type="button"
              mix={[
                action,
                resetAction,
                on("click", () => {
                  answer = "";
                  notice = "";
                  submitted = false;
                  saveChange("unattempted", false);
                }),
              ]}
            >
              Reset
            </button>
            {problemOnAssignment(problem.type, problem.number) ? (
              <button
                type="button"
                mix={[
                  action,
                  submitAction,
                  on("click", () => {
                    if (!correct) {
                      notice = "Submit needs the right rule.";
                      handle.update();
                      return;
                    }
                    notice = submitted ? "Resubmitted." : "Submitted.";
                    submitted = true;
                    saveChange("correct", true);
                  }),
                ]}
              >
                {submitted ? "Resubmit" : "Submit"}
              </button>
            ) : null}
          </div>
        </div>
        {lines ? (
          <div
            mix={css({
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: t.space.xl,
              fontSize: t.fontSize.lg,
              lineHeight: t.lineHeight.normal,
            })}
          >
            <div mix={css({ display: "flex", flexDirection: "column", alignItems: "flex-start" })}>
              {lines.premises.map((premise) => (
                <div>{premise}</div>
              ))}
              <div
                mix={css({
                  marginTop: t.space.xs,
                  paddingTop: t.space.xs,
                  borderTopWidth: "1px",
                  borderTopStyle: "solid",
                  borderTopColor: t.colors.text.primary,
                })}
              >
                {lines.conclusion}
              </div>
            </div>
            <label
              mix={css({
                display: "flex",
                flexShrink: "0",
                flexDirection: "row",
                alignItems: "center",
                gap: t.space.md,
                fontSize: t.fontSize.md,
                whiteSpace: "nowrap",
              })}
            >
              Please enter the rule that applies, or enter "None".
              <input
                value={answer}
                mix={[
                  on("input", (event) => {
                    answer = event.currentTarget.value;
                    notice = "";
                    saveChange();
                  }),
                  css({
                    width: "6rem",
                    margin: 0,
                    paddingInline: t.space.sm,
                    paddingBlock: t.space.xs,
                    border: "none",
                    outline: "none",
                    backgroundColor: "#fff59a",
                    color: t.colors.text.primary,
                    font: "inherit",
                    fontSize: t.fontSize.md,
                    lineHeight: t.lineHeight.normal,
                    "&:focus": {
                      backgroundColor: "#ffe14a",
                      outline: "none",
                    },
                  }),
                ]}
              />
            </label>
          </div>
        ) : (
          <p mix={css({ color: t.colors.text.warning })}>{expected}</p>
        )}
        {notice ? (
          <div
            mix={css({
              position: "fixed",
              right: t.space.xl,
              bottom: t.space.xl,
              paddingInline: t.space.lg,
              paddingBlock: t.space.md,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.text.primary,
              color: t.surface.lvl0,
              fontSize: t.fontSize.sm,
              boxShadow: t.shadow.md,
            })}
          >
            {notice}
          </div>
        ) : null}
      </div>
    );
  };
}
