import { ChevronDown, ChevronRight, Ellipsis } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { problemOnAssignment } from "#app/data/assignments.ts";
import type { Problem } from "#app/data/problems.ts";
import { getProgress, writeProgress } from "#app/data/progress.ts";
import { Icon } from "#app/components/Icon.tsx";
import {
  type DerivationLine,
  checkDerivation,
  simpleAnnotations,
  formatFormula,
  inferSymbols,
  parseArgument,
} from "#app/logic/derivation.ts";
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

const lineField = css({
  margin: 0,
  padding: 0,
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  boxShadow: "none",
  color: t.colors.text.primary,
  fontSize: t.fontSize.md,
  fontWeight: t.fontWeight.normal,
  lineHeight: t.lineHeight.normal,
  "&::placeholder": {
    color: t.colors.text.muted,
    opacity: 1,
  },
  "&:focus": {
    outline: "none",
  },
});

export interface DerivationProblemProps {
  problem: Problem;
}

function argumentParts(problem: string) {
  let parsed = parseArgument(problem);
  if (typeof parsed === "string") return null;
  return {
    premises: parsed.premises.map((formula) => formatFormula(formula)),
    conclusion: formatFormula(parsed.conclusion),
  };
}

const ruleHelp: Record<string, string> = {
  pr: "A premise from the problem.",
  "ass cd": "Assume the if-part.",
  "ass id": "Assume the opposite.",
  r: "Copy an earlier line.",
  mp: "From P and P→Q, get Q.",
  mt: "From ~Q and P→Q, get ~P.",
  dn: "Cancel two nots.",
  cd: "Done when the then-part is shown.",
  id: "Done when a line and its opposite both appear.",
  dd: "Done when the shown line is copied.",
  "show conc": "Start the conclusion.",
  "show cons": "Start the then-part.",
  "show ant": "Start the if-part.",
  "show negcons": "Start the opposite of the then-part.",
  "show unneg": "Start the formula under the not.",
};

function hasWork(lines: DerivationLine[]) {
  return lines.some((line) => line.symbols.trim() !== "" || line.annotation.trim() !== "");
}

function parseWork(work: string | undefined): DerivationLine[] | null {
  if (!work) return null;
  try {
    let parsed = JSON.parse(work) as DerivationLine[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function DerivationProblem(handle: Handle<DerivationProblemProps>) {
  let loaded = "";
  let lines: DerivationLine[] = [];
  let notice = "";
  let focusAnnotation: number | null = null;
  let collapsed = new Set<number>();
  let hoverLine: number | null = null;
  let dirty = false;
  let helpOpen = false;
  let submitted = false;
  let submission = "";
  let showSubmission = false;

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
    let restored = parseWork(saved?.work);
    loaded = `${problem.type}:${problem.number}`;
    if (restored) lines = restored;
    submitted = saved?.submitted ?? false;
    submission = saved?.submission ?? "";
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
    submission?: string,
  ) {
    let { problem } = handle.props;
    return writeProgress(problem.type, problem.number, {
      status: status ?? (hasWork(lines) ? "in-progress" : "unattempted"),
      work: JSON.stringify(lines),
      ...(submitted == null ? {} : { submitted }),
      ...(submission == null ? {} : { submission }),
    });
  }

  function saveChange(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
    submission?: string,
  ) {
    dirty = true;
    void handle.update().then((signal) => {
      if (signal.aborted) return;
      void persist(status, submitted, submission);
    });
  }

  return () => {
    let { problem } = handle.props;
    let key = `${problem.type}:${problem.number}`;
    if (loaded !== key) {
      loaded = key;
      lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
      notice = "";
      collapsed = new Set();
      hoverLine = null;
      dirty = false;
      submitted = false;
      submission = "";
      showSubmission = false;
      void restore(problem);
    }

    function finished(
      source: DerivationLine[],
      checkedLines: ReturnType<typeof checkDerivation>["lines"],
      index: number,
    ) {
      let line = source[index];
      let checked = checkedLines[index];
      if (!line || !checked || checked.error) return false;
      if (checked.closesShow) return true;
      return checked.formula !== null && line.annotation.trim() !== "";
    }

    let result = checkDerivation(problem.problem, lines);
    let parts = argumentParts(problem.problem);
    let last = lines.at(-1);
    let lastIndex = lines.length - 1;
    if (
      last &&
      lastIndex > 0 &&
      last.symbols.trim() === "" &&
      last.annotation.trim() === "" &&
      !finished(lines, result.lines, lastIndex - 1)
    ) {
      lines.pop();
      result = checkDerivation(problem.problem, lines);
      last = lines.at(-1);
      lastIndex = lines.length - 1;
    }
    if (last && finished(lines, result.lines, lastIndex) && (last.symbols.trim() !== "" || last.annotation.trim() !== "")) {
      lines.push({ symbols: "", annotation: "", depth: 0, entered: false });
      result = checkDerivation(problem.problem, lines);
    }
    if (focusAnnotation !== null) {
      let target = focusAnnotation;
      focusAnnotation = null;
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>(`[data-annotation="${target}"]`)?.focus();
      });
    }

    const numberSlot = css({
      width: t.layout.section,
      margin: 0,
      paddingInline: t.space.sm,
      boxSizing: "border-box",
    });

    const row = css({
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr) minmax(8rem, 14rem)",
      alignItems: "center",
      columnGap: t.space.md,
    });

    let active = lines;
    let activeResult = result;
    let readOnly = false;

    function watchLine(index: number) {
      return [
        on("mouseenter", () => {
          hoverLine = index;
          handle.update();
        }),
        on("mouseleave", (event) => {
          let next = event.relatedTarget;
          if (next instanceof Element && next.closest(`[data-line="${index}"]`)) return;
          if (hoverLine === index) hoverLine = null;
          handle.update();
        }),
      ];
    }

    function renderRow(index: number, line: DerivationLine, rowNumber: number) {
      let checked = activeResult.lines[index];
      let showCaret = checked?.boxed != null && hoverLine === index;
      let placed = `${rowNumber}`;
      return (
        <div key={index} mix={css({ display: "contents" })}>
          {showCaret ? (
            <button
              type="button"
              aria-label={collapsed.has(index) ? "Open derivation" : "Close derivation"}
              data-line={index}
              mix={[
                css({
                  gridColumn: "1",
                  gridRow: placed,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  border: "none",
                  backgroundColor: "transparent",
                  color: t.colors.text.primary,
                  cursor: "pointer",
                }),
                numberSlot,
                ...watchLine(index),
                on("click", () => {
                  if (collapsed.has(index)) collapsed.delete(index);
                  else collapsed.add(index);
                  handle.update();
                }),
              ]}
            >
              <Icon
                icon={collapsed.has(index) ? ChevronRight : ChevronDown}
                mix={css({ width: t.space.xl, height: t.space.xl })}
              />
            </button>
          ) : (
            <h2
              data-line={index}
              mix={[
                css({
                  gridColumn: "1",
                  gridRow: placed,
                  color: t.colors.text.primary,
                  fontSize: t.fontSize.md,
                  fontWeight: t.fontWeight.normal,
                  lineHeight: t.lineHeight.normal,
                  textAlign: "right",
                }),
                numberSlot,
                ...watchLine(index),
              ]}
            >
              {index + 1}.
            </h2>
          )}
          <div
            mix={css({
              gridColumn: "2",
              gridRow: placed,
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              minWidth: "0",
              paddingLeft: `${line.depth * 24}px`,
            })}
          >
            {boxGuides(index)}
            {(() => {
            let showText = /^(\s*show\b)(.*)$/i.exec(line.symbols);
            let crossed = Boolean(checked?.show && checked.boxed && showText);
            return (
              <>
                {crossed && showText ? (
                  <span
                    mix={css({
                      paddingLeft: t.space.sm,
                      color: t.colors.text.primary,
                      fontSize: t.fontSize.md,
                      lineHeight: t.lineHeight.normal,
                      textDecoration: "line-through",
                    })}
                  >
                    {showText[1]}
                  </span>
                ) : null}
                <input
                  mix={[
                    lineField,
                    css({
                      minWidth: "0",
                      flex: "1",
                      paddingLeft: crossed ? "0px" : t.space.sm,
                      "&:hover": { backgroundColor: t.surface.lvl1 },
                    }),
                    ...watchLine(index),
                    on("input", (event) => {
                      if (readOnly) return;
                      let typed = event.currentTarget.value;
                      line.symbols = crossed && showText ? `${showText[1]}${typed}` : typed;
                      saveChange();
                    }),
                  ]}
                  data-line={index}
                  placeholder={line.depth > 0 ? "" : "Formula"}
                  readOnly={readOnly}
                  type="text"
                  value={crossed && showText ? showText[2] : line.symbols}
                />
              </>
            );
          })()}
          </div>
          <input
            mix={[
              lineField,
              css({
                gridColumn: "3",
                gridRow: placed,
                paddingInline: t.space.sm,
                color: checked?.error ? t.colors.text.warning : t.colors.text.primary,
                "&:hover": { backgroundColor: t.surface.lvl1 },
                "&:focus": { backgroundColor: t.surface.lvl1 },
              }),
              ...watchLine(index),
              on("input", (event) => {
                if (readOnly) return;
                line.annotation = event.currentTarget.value;
                line.entered = false;
                saveChange();
              }),
              on("keydown", (event) => {
                if (readOnly || event.key !== "Enter") return;
                event.preventDefault();
                line.entered = true;
                let symbols = inferSymbols(problem.problem, lines, index);
                if (symbols !== null) line.symbols = symbols;
                let next = checkDerivation(problem.problem, lines);
                if (finished(lines, next.lines, index)) focusAnnotation = index + 1;
                saveChange();
              }),
            ]}
            data-annotation={index}
            data-line={index}
            placeholder="Annotation"
            readOnly={readOnly}
            title={checked?.error ?? ""}
            type="text"
            value={line.annotation}
          />
        </div>
      );
    }

    function boxGuides(index: number) {
      let guides = [];
      let depth = active[index]?.depth ?? 0;
      for (let show = index - 1; show >= 0 && depth > 0; show -= 1) {
        if ((active[show]?.depth ?? 0) !== depth - 1) continue;
        let level = depth;
        depth -= 1;
        let stop = show + 1;
        while (stop < active.length && (active[stop]?.depth ?? 0) > (active[show]?.depth ?? 0)) stop += 1;
        let boxed = Boolean(activeResult.lines[show]?.boxed) && !collapsed.has(show);
        let color = boxed ? t.colors.text.primary : "transparent";
        let inset = `${level * 24}px`;
        guides.push(
          <div
            key={`left-${show}`}
            mix={css({
              position: "absolute",
              top: "0px",
              bottom: "0px",
              left: inset,
              width: t.space.px,
              backgroundColor: color,
              pointerEvents: "none",
            })}
          />,
          <div
            key={`right-${show}`}
            mix={css({
              position: "absolute",
              top: "0px",
              bottom: "0px",
              right: "0px",
              width: t.space.px,
              backgroundColor: color,
              pointerEvents: "none",
            })}
          />,
        );
        if (index === show + 1) {
          guides.push(
            <div
              key={`top-${show}`}
              mix={css({
                position: "absolute",
                top: "0px",
                left: inset,
                right: "0px",
                height: t.space.px,
                backgroundColor: color,
                pointerEvents: "none",
              })}
            />,
          );
        }
        if (index === stop - 1) {
          guides.push(
            <div
              key={`bottom-${show}`}
              mix={css({
                position: "absolute",
                bottom: "0px",
                left: inset,
                right: "0px",
                height: t.space.px,
                backgroundColor: color,
                pointerEvents: "none",
              })}
            />,
          );
        }
      }
      return guides;
    }

    function hidden(index: number) {
      let depth = active[index]?.depth ?? 0;
      for (let show = index - 1; show >= 0 && depth > 0; show -= 1) {
        if ((active[show]?.depth ?? 0) !== depth - 1) continue;
        if (collapsed.has(show)) return true;
        depth -= 1;
      }
      return false;
    }

    function renderTree() {
      let nodes = [];
      let rowNumber = 1;
      for (let index = 0; index < active.length; index += 1) {
        let line = active[index];
        if (!line || hidden(index)) continue;
        nodes.push(renderRow(index, line, rowNumber));
        rowNumber += 1;
        if (activeResult.lines[index]?.boxed && collapsed.has(index)) {
          nodes.push(
            <div
              key={`ellipsis-${index}`}
              mix={css({
                gridColumn: "2",
                gridRow: `${rowNumber}`,
                display: "flex",
                paddingLeft: `${(line.depth + 1) * 24 + 8}px`,
                color: t.colors.text.primary,
              })}
            >
              <Icon icon={Ellipsis} mix={css({ width: t.space.xl, height: t.space.xl })} />
            </div>,
          );
          rowNumber += 1;
        }
      }
      return (
        <div mix={row}>
          {nodes}
        </div>
      );
    }

    function renderSubmission() {
      let saved = parseWork(submission);
      if (!saved) return null;
      active = saved.map((line) => ({ ...line }));
      activeResult = checkDerivation(problem.problem, active);
      let last = active.at(-1);
      let lastIndex = active.length - 1;
      if (
        last &&
        finished(active, activeResult.lines, lastIndex) &&
        (last.symbols.trim() !== "" || last.annotation.trim() !== "")
      ) {
        active.push({ symbols: "", annotation: "", depth: 0, entered: false });
        activeResult = checkDerivation(problem.problem, active);
      }
      readOnly = true;
      let tree = renderTree();
      active = lines;
      activeResult = result;
      readOnly = false;
      return tree;
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
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: t.space.md,
            paddingBottom: t.space.xxl,
          })}
        >
          <h2
            mix={[
              css({
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
              }),
            ]}
          >
            <span mix={css({ alignSelf: "flex-start", color: t.colors.text.secondary, fontSize: t.fontSize.lg })}>
              Derivation {problem.number}
            </span>
            {parts ? (
              <span
                mix={css({
                  display: "inline-flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  gap: "1.75em",
                  fontSize: t.fontSize.lg,
                })}
              >
                {parts.premises.map((premise, index) => (
                  <span
                    mix={css({
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: t.space.xs,
                    })}
                  >
                    {premise}.
                    <span mix={css({ color: t.colors.text.muted, fontSize: t.fontSize.sm })}>
                      pr{index + 1}
                    </span>
                  </span>
                ))}
                <span mix={css({ alignSelf: "flex-start" })}>∴ {parts.conclusion}</span>
              </span>
            ) : (
              <span mix={css({ fontSize: t.fontSize.lg })}>{problem.problem}</span>
            )}
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
            <div
              mix={css({
                position: "relative",
                display: "flex",
              })}
            >
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
                    width: "28rem",
                    maxHeight: "70vh",
                    overflow: "auto",
                    marginTop: t.space.sm,
                    padding: t.space.lg,
                    backgroundColor: t.surface.lvl0,
                    boxShadow: t.shadow.md,
                    fontSize: t.fontSize.sm,
                    lineHeight: t.lineHeight.normal,
                  })}
                >
                  {simpleAnnotations.map((rule) => (
                    <div
                      key={rule.name}
                      mix={css({
                        display: "grid",
                        gridTemplateColumns: "7.5rem 1fr",
                        gap: t.space.sm,
                        paddingBlock: t.space.xs,
                      })}
                    >
                      <div>
                        <div mix={css({ color: t.colors.text.secondary })}>{rule.name}</div>
                        <div mix={css({ color: t.colors.text.muted })}>{rule.symbols}</div>
                      </div>
                      <div>{ruleHelp[rule.name]}</div>
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
                  notice = result.complete ? "Checked: complete." : "Checked: incomplete.";
                  saveChange(result.complete ? "correct" : "incorrect");
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
                  lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
                  collapsed = new Set();
                  hoverLine = null;
                  notice = "";
                  saveChange("unattempted");
                }),
              ]}
            >
              Reset
            </button>
            {problemOnAssignment(problem.type, problem.number) ? (
              <div mix={css({ position: "relative" })}>
                <button
                  type="button"
                  mix={[
                    action,
                    submitAction,
                    on("click", () => {
                      if (!result.complete) {
                        notice = "Submit needs a finished derivation.";
                        handle.update();
                        return;
                      }
                      notice = submitted ? "Resubmitted." : "Submitted.";
                      submitted = true;
                      submission = JSON.stringify(
                        lines.filter((line) => line.symbols.trim() !== "" || line.annotation.trim() !== ""),
                      );
                      saveChange("correct", true, submission);
                    }),
                  ]}
                >
                  {submitted ? "Resubmit" : "Submit"}
                </button>
                {submission ? (
                  <button
                    type="button"
                    mix={[
                      css({
                        position: "absolute",
                        top: "100%",
                        right: "0px",
                        display: "grid",
                        margin: 0,
                        padding: 0,
                        border: "none",
                        backgroundColor: "transparent",
                        color: t.colors.text.secondary,
                        font: "inherit",
                        fontSize: t.fontSize.sm,
                        lineHeight: t.lineHeight.normal,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#e4eef8",
                          color: t.colors.text.primary,
                        },
                      }),
                      on("click", () => {
                        showSubmission = !showSubmission;
                        handle.update();
                      }),
                    ]}
                  >
                    <span mix={css({ gridArea: "1 / 1", visibility: showSubmission ? "hidden" : "visible" })}>
                      View Submission
                    </span>
                    <span mix={css({ gridArea: "1 / 1", visibility: showSubmission ? "visible" : "hidden" })}>
                      Hide Submission
                    </span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div mix={css({ display: "grid" })}>
          <div
            mix={css({
              gridArea: "1 / 1",
              visibility: showSubmission ? "hidden" : "visible",
            })}
          >
            {result.problemError ? (
              <p mix={css({ color: t.colors.text.warning })}>{result.problemError}</p>
            ) : null}
            {renderTree()}
          </div>
          {parseWork(submission) ? (
            <div
              mix={css({
                gridArea: "1 / 1",
                visibility: showSubmission ? "visible" : "hidden",
                alignSelf: "start",
              })}
            >
              {renderSubmission()}
            </div>
          ) : null}
        </div>
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
