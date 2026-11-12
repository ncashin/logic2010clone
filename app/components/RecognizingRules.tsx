import { Check } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { Icon } from "#app/components/Icon.tsx";
import { problemOnAssignment } from "#app/data/assignments.ts";
import { problemStatement, type Problem } from "#app/data/problems.ts";
import { getProgress, peekProgress, writeProgress } from "#app/data/progress.ts";
import { sectionPadding } from "#app/components/Welcome.tsx";
import { formatFormula, parseArgument, recognizeRule } from "#app/logic/derivation.ts";
import { t } from "#app/theme.ts";

function actionStyle(tone: "default" | "reset" | "submit") {
  return css({
    display: "inline-flex",
    alignItems: "center",
    gap: t.space.xs,
    paddingInline: t.space.md,
    paddingBlock: t.space.xs,
    border: "none",
    borderRadius: t.radius.none,
    backgroundColor:
      tone === "reset" ? t.colors.action.danger.background : tone === "submit" ? "#16a34a" : "#e4eef8",
    color:
      tone === "reset" ? t.colors.action.danger.foreground : tone === "submit" ? "#ffffff" : t.colors.text.primary,
    font: "inherit",
    fontSize: t.fontSize.sm,
    lineHeight: t.lineHeight.normal,
    cursor: "pointer",
    "&:hover": {
      backgroundColor:
        tone === "reset" ? t.colors.action.danger.backgroundHover : tone === "submit" ? "#15803d" : "#c5d8f0",
    },
  });
}

const action = actionStyle("default");
const resetAction = actionStyle("reset");
const submitAction = actionStyle("submit");

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
    let nextAnswer = saved?.work ?? "";
    let nextSubmitted = saved?.submitted ?? false;
    loaded = `${problem.type}:${problem.number}`;
    if (answer === nextAnswer && submitted === nextSubmitted) return;
    answer = nextAnswer;
    submitted = nextSubmitted;
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    let { problem } = handle.props;
    let given = normalize(answer);
    let correct = given !== "" && given === recognizeRule(problem.problem);
    return writeProgress(problem.type, problem.number, {
      status: status ?? (correct ? "correct" : answer.trim() ? "in-progress" : "unattempted"),
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
      let saved = peekProgress(problem.type, problem.number);
      loaded = key;
      answer = saved?.work ?? "";
      notice = "";
      dirty = false;
      helpOpen = false;
      submitted = saved?.submitted ?? false;
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
            flexDirection: "column",
            gap: t.space.md,
            paddingBottom: t.space.xxl,
            boxSizing: "border-box",
          })}
        >
        <div
          mix={css({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: t.space.md,
          })}
        >
          <h2
            mix={css({
              margin: 0,
              color: t.colors.text.secondary,
              fontSize: t.fontSize.lg,
              fontWeight: t.fontWeight.semibold,
              lineHeight: t.lineHeight.normal,
              whiteSpace: "nowrap",
            })}
          >
            Recognizing Rules {problem.number}
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
            <button type="button" mix={[action]}>
              Feedback
            </button>
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
              <Icon icon={Check} mix={css({ width: t.space.xl, height: t.space.xl })} />
              Check
            </button>
            <button
              type="button"
              mix={[
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
                flex: "1",
                minWidth: "0",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: t.space.sm,
                fontSize: t.fontSize.md,
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
                    borderWidth: t.space.px,
                    borderStyle: "solid",
                    borderColor: t.colors.border.default,
                    outline: "none",
                    backgroundColor: t.surface.lvl0,
                    color: t.colors.text.primary,
                    font: "inherit",
                    fontSize: t.fontSize.md,
                    lineHeight: t.lineHeight.normal,
                    "&:focus": {
                      outline: "none",
                      borderColor: t.colors.text.secondary,
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
              top: t.space.xl,
              left: "50%",
              transform: "translateX(-50%)",
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
