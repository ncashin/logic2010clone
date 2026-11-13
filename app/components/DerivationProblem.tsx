import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  CircleAlert,
  Ellipsis,
  Redo2,
  Trash2,
  Undo2,
} from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on, ref } from "remix/component";

import { problemOnAssignment } from "#app/data/assignments.ts";
import { problemStatement, type Problem } from "#app/data/problems.ts";
import { getProgress, peekProgress, writeProgress } from "#app/data/progress.ts";
import { Icon } from "#app/components/Icon.tsx";
import {
  type DerivationLine,
  annotationCites,
  checkDerivation,
  formatFormula,
  inferSymbols,
  omitsFormula,
  parseArgument,
} from "#app/logic/derivation.ts";
import { sectionPadding } from "#app/components/Welcome.tsx";
import ruleHelp from "#app/data/rule-help.json";
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
  "&:focus::placeholder": {
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

function HelpSample(handle: Handle<{ lines: (typeof ruleHelp)[number]["lines"] }>) {
  return () => {
    let lines = handle.props.lines;
    return (
      <div
        mix={css({
          display: "grid",
          gridTemplateColumns: "2.5rem minmax(0, 1fr) 11rem",
          alignItems: "center",
          marginInline: t.space.md,
          marginBottom: t.space.md,
          columnGap: t.space.md,
        })}
      >
        <span
          mix={css({
            gridColumn: "2",
            gridRow: "1",
            paddingLeft: t.space.sm,
            paddingBottom: t.space.xs,
            color: t.colors.text.muted,
            fontSize: t.fontSize.sm,
            lineHeight: t.lineHeight.normal,
          })}
        >
          Formula
        </span>
        <span
          mix={css({
            gridColumn: "3",
            gridRow: "1",
            paddingInline: t.space.sm,
            paddingBottom: t.space.xs,
            color: t.colors.text.muted,
            fontSize: t.fontSize.sm,
            lineHeight: t.lineHeight.normal,
          })}
        >
          Annotation
        </span>
        {lines.map((line, index) => {
          let placed = `${index + 2}`;
          let band = index % 2 === 0 ? t.surface.lvl1 : t.surface.lvl0;
          let show = /^(\s*show\b)(.*)$/i.exec(line.formula);
          return (
            <div key={line.number} mix={css({ display: "contents" })}>
              <div
                aria-hidden="true"
                mix={css({
                  gridColumn: "1 / -1",
                  gridRow: placed,
                  alignSelf: "stretch",
                  backgroundColor: band,
                  boxShadow: `inset 0 -1px 0 ${t.colors.border.subtle}`,
                  pointerEvents: "none",
                })}
              />
              <span
                mix={css({
                  gridColumn: "1",
                  gridRow: placed,
                  paddingBlock: t.space.sm,
                  paddingInline: t.space.sm,
                  color: t.colors.text.primary,
                  fontSize: t.fontSize.md,
                  lineHeight: t.lineHeight.normal,
                  textAlign: "right",
                })}
              >
                {line.number}.
              </span>
              <div
                mix={css({
                  gridColumn: "2",
                  gridRow: placed,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "0",
                  minHeight: "100%",
                  paddingBlock: t.space.sm,
                  paddingLeft: `${line.depth * 24 + 4}px`,
                  fontSize: t.fontSize.md,
                  lineHeight: t.lineHeight.normal,
                })}
              >
                {helpBox(lines, index)}
                {show ? (
                  <span
                    mix={css({
                      marginRight: "0.35em",
                      fontWeight: t.fontWeight.bold,
                    })}
                  >
                    {show[1].trim()}
                  </span>
                ) : null}
                <span>{show ? show[2].trim() : line.formula}</span>
              </div>
              <span
                mix={css({
                  gridColumn: "3",
                  gridRow: placed,
                  paddingBlock: t.space.sm,
                  paddingInline: t.space.sm,
                  color: t.colors.text.primary,
                  fontSize: t.fontSize.md,
                  lineHeight: t.lineHeight.normal,
                  whiteSpace: "nowrap",
                })}
              >
                {line.annotation}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
}

function helpBox(lines: (typeof ruleHelp)[number]["lines"], index: number) {
  let guides = [];
  let depth = lines[index]?.depth ?? 0;
  for (let show = index - 1; show >= 0 && depth > 0; show -= 1) {
    if ((lines[show]?.depth ?? 0) !== depth - 1) continue;
    let level = depth;
    depth -= 1;
    let stop = show + 1;
    while (stop < lines.length && (lines[stop]?.depth ?? 0) > (lines[show]?.depth ?? 0)) stop += 1;
    let color = lines[show]?.strike ? t.colors.text.primary : "transparent";
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
          })}
        />,
      );
    }
  }
  return guides;
}

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
  let noticeTone: "success" | "partial" | "neutral" = "neutral";
  let revealErrors = false;
  let errorTip = "";
  let errorTipX = 0;
  let errorTipY = 0;
  let focusAnnotation: number | null = null;
  let collapsed = new Set<number>();
  let hoverLine: number | null = null;
  let citeHover: number | null = null;
  let editingLine: number | null = null;
  let citeTimer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let helpOpen = false;
  let helpOpenRules = new Set<string>();
  let past: string[] = [];
  let future: string[] = [];
  let typing = false;
  let submitted = false;
  let submission = "";
  let showSubmission = false;
  let noticeFade = false;
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;

  function hideNotice() {
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = null;
    notice = "";
    noticeFade = false;
  }

  function showNotice(message: string, tone: "success" | "partial" | "neutral") {
    if (noticeTimer) clearTimeout(noticeTimer);
    notice = message;
    noticeTone = tone;
    noticeFade = false;
    noticeTimer = setTimeout(() => {
      noticeFade = true;
      handle.update();
      noticeTimer = setTimeout(() => {
        notice = "";
        noticeFade = false;
        noticeTimer = null;
        handle.update();
      }, 500);
    }, 2200);
  }

  handle.queueTask(() => {
    void restore(handle.props.problem);
  });
  handle.signal.addEventListener("abort", () => {
    if (citeTimer) clearTimeout(citeTimer);
    if (noticeTimer) clearTimeout(noticeTimer);
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
    let nextLines = restored ?? [{ symbols: "", annotation: "", depth: 0, entered: false }];
    let nextSubmitted = saved?.submitted ?? false;
    let nextSubmission = saved?.submission ?? "";
    loaded = `${problem.type}:${problem.number}`;
    if (
      JSON.stringify(lines) === JSON.stringify(nextLines) &&
      submitted === nextSubmitted &&
      submission === nextSubmission
    ) {
      return;
    }
    lines = nextLines;
    submitted = nextSubmitted;
    submission = nextSubmission;
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
    submission?: string,
  ) {
    let { problem } = handle.props;
    let complete = checkDerivation(problem.problem, lines).complete;
    return writeProgress(problem.type, problem.number, {
      status: status ?? (complete ? "correct" : hasWork(lines) ? "in-progress" : "unattempted"),
      work: JSON.stringify(lines),
      ...(submitted == null ? {} : { submitted }),
      ...(submission == null ? {} : { submission }),
    });
  }

  function snapshot(): string {
    return JSON.stringify({
      lines,
      collapsed: [...collapsed],
    });
  }

  function restoreSnapshot(saved: string) {
    let parsed = JSON.parse(saved) as { lines: DerivationLine[]; collapsed: number[] };
    lines = parsed.lines;
    collapsed = new Set(parsed.collapsed);
    typing = false;
  }

  function remember(groupTyping: boolean) {
    if (groupTyping && typing) return;
    past.push(snapshot());
    if (past.length > 100) past.shift();
    future = [];
    typing = groupTyping;
  }

  function undo() {
    let saved = past.pop();
    if (!saved) return;
    future.push(snapshot());
    restoreSnapshot(saved);
    revealErrors = false;
    hideNotice();
    saveChange();
  }

  function redo() {
    let saved = future.pop();
    if (!saved) return;
    past.push(snapshot());
    restoreSnapshot(saved);
    revealErrors = false;
    hideNotice();
    saveChange();
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
      let saved = peekProgress(problem.type, problem.number);
      loaded = key;
      lines = parseWork(saved?.work) ?? [{ symbols: "", annotation: "", depth: 0, entered: false }];
      hideNotice();
      revealErrors = false;
      collapsed = new Set();
      hoverLine = null;
      citeHover = null;
      editingLine = null;
      if (citeTimer) clearTimeout(citeTimer);
      citeTimer = null;
      dirty = false;
      past = [];
      future = [];
      typing = false;
      submitted = saved?.submitted ?? false;
      submission = saved?.submission ?? "";
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

    const lineAction = css({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: t.space.xs,
      border: "none",
      backgroundColor: "transparent",
      color: t.colors.text.muted,
      cursor: "pointer",
      "&:hover": { color: t.colors.text.primary },
    });

    const numberSlot = css({
      width: t.layout.section,
      margin: 0,
      paddingInline: t.space.sm,
      boxSizing: "border-box",
    });

    const row = css({
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr) minmax(8rem, 14rem) auto",
      alignItems: "center",
      columnGap: t.space.md,
    });

    let active = lines;
    let activeResult = result;
    let readOnly = false;

    function armCiteHover(index: number) {
      if (citeTimer) clearTimeout(citeTimer);
      if (editingLine != null) {
        citeTimer = null;
        return;
      }
      citeTimer = setTimeout(() => {
        citeTimer = null;
        if (hoverLine !== index || editingLine === index) return;
        citeHover = index;
        handle.update();
      }, 600);
    }

    function watchLine(index: number) {
      return [
        on("mouseenter", () => {
          hoverLine = index;
          if (citeHover !== index) citeHover = null;
          armCiteHover(index);
          handle.update();
        }),
        on("mouseleave", (event) => {
          let next = event.relatedTarget;
          if (next instanceof Element && next.closest(`[data-line="${index}"]`)) return;
          if (hoverLine === index) hoverLine = null;
          if (citeHover === index) citeHover = null;
          if (citeTimer) clearTimeout(citeTimer);
          citeTimer = null;
          handle.update();
        }),
      ];
    }

    function beginEdit(index: number) {
      editingLine = index;
      citeHover = null;
      if (citeTimer) clearTimeout(citeTimer);
      citeTimer = null;
      typing = false;
      handle.update();
    }

    function endEdit(index: number) {
      queueMicrotask(() => {
        if (document.activeElement?.closest(`[data-line="${index}"]`)) return;
        if (editingLine === index) editingLine = null;
        if (hoverLine != null) armCiteHover(hoverLine);
        handle.update();
      });
    }

    function shiftCollapsed(from: number, delta: number) {
      collapsed = new Set(
        [...collapsed].map((item) => (item >= from ? item + delta : item)),
      );
    }

    function shiftAnnotations(from: number, delta: number) {
      for (let line of lines) {
        if (/^\s*PR\s*\d+\s*$/i.test(line.annotation)) continue;
        line.annotation = line.annotation.replace(/\d+/g, (digits) => {
          let number = Number(digits);
          if (number < from) return digits;
          return String(number + delta);
        });
      }
    }

    function insertLine(index: number) {
      if (readOnly) return;
      remember(false);
      let depth = lines[index]?.depth ?? 0;
      shiftAnnotations(index + 1, 1);
      lines.splice(index, 0, { symbols: "", annotation: "", depth, entered: false });
      shiftCollapsed(index, 1);
      saveChange();
    }

    function removeLine(index: number) {
      if (readOnly) return;
      remember(false);
      if (lines.length <= 1) {
        lines[0] = { symbols: "", annotation: "", depth: 0, entered: false };
      } else {
        shiftAnnotations(index + 2, -1);
        lines.splice(index, 1);
        collapsed.delete(index);
        collapsed = new Set([...collapsed].map((item) => (item > index ? item - 1 : item)));
      }
      saveChange();
    }

    function citedByHover(index: number) {
      if (editingLine != null || citeHover == null || citeHover === index) return false;
      return annotationCites(active[citeHover]?.annotation ?? "").includes(index + 1);
    }

    function citedPremise() {
      if (editingLine != null || citeHover == null) return null;
      let match = /^\s*pr\s*(\d+)\s*$/i.exec(active[citeHover]?.annotation ?? "");
      return match?.[1] ? Number(match[1]) : null;
    }

    function renderRow(index: number, line: DerivationLine, rowNumber: number) {
      let checked = activeResult.lines[index];
      let lineHover = editingLine == null || editingLine === index ? hoverLine : null;
      let showCaret = checked?.boxed != null && lineHover === index;
      let cited = citedByHover(index);
      let placed = `${rowNumber}`;
      let band = cited
        ? "#f8efe0"
        : lineHover === index
          ? rowNumber % 2 === 0
            ? "#f7f8f9"
            : "#fbfcfd"
          : rowNumber % 2 === 0
            ? t.surface.lvl1
            : t.surface.lvl0;
      return (
        <div key={index} mix={css({ display: "contents" })}>
          <div
            aria-hidden="true"
            mix={css({
              gridColumn: "1 / -1",
              gridRow: placed,
              alignSelf: "stretch",
              backgroundColor: band,
              boxShadow: `inset 0 -1px 0 ${t.colors.border.subtle}`,
              pointerEvents: "none",
            })}
          />
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
                  justifyContent: "center",
                  alignSelf: "stretch",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#111827",
                  cursor: "pointer",
                }),
                numberSlot,
                ...watchLine(index),
                on("click", () => {
                  remember(false);
                  if (collapsed.has(index)) collapsed.delete(index);
                  else collapsed.add(index);
                  handle.update();
                }),
              ]}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                aria-hidden="true"
                mix={css({
                  display: "block",
                  width: "14px",
                  height: "14px",
                  flexShrink: "0",
                })}
              >
                <path
                  d={
                    collapsed.has(index)
                      ? "M5.1 2.4 L11.2 8 L5.1 13.6 L6.7 13.6 L12.8 8 L6.7 2.4 Z"
                      : "M2.4 5.1 L8 11.2 L13.6 5.1 L13.6 6.7 L8 12.8 L2.4 6.7 Z"
                  }
                  fill="#111827"
                />
              </svg>
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
                  paddingBlock: t.space.sm,
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
            mix={[
              css({
                gridColumn: "2",
                gridRow: placed,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: "0",
                paddingLeft: `${line.depth * 24}px`,
              }),
            ]}
          >
            {boxGuides(index)}
            {(() => {
            let showText = /^(\s*show\b)(.*)$/i.exec(line.symbols);
            let crossed = Boolean(checked?.show && checked.boxed && showText);
            return (
              <div
                mix={css({
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  minWidth: "0",
                })}
              >
                {showText ? (
                  <span
                    mix={css({
                      paddingLeft: t.space.sm,
                      color: t.colors.text.primary,
                      fontSize: t.fontSize.md,
                      fontWeight: t.fontWeight.bold,
                      lineHeight: t.lineHeight.normal,
                      textDecoration: crossed ? "line-through" : "none",
                    })}
                  >
                    {showText[1]}
                  </span>
                ) : null}
                <input
                  mix={[
                    lineField,
                    css({
                      width: "100%",
                      minWidth: "0",
                      flex: "1",
                      paddingBlock: t.space.sm,
                      paddingLeft: showText ? "0px" : t.space.sm,
                      fontWeight: t.fontWeight.normal,
                      backgroundColor: "transparent",
                    }),
                    ...watchLine(index),
                    on("focus", () => {
                      beginEdit(index);
                    }),
                    on("blur", () => {
                      endEdit(index);
                    }),
                    on("keydown", (event) => {
                      if (!showText || readOnly || event.key !== "Backspace") return;
                      let field = event.currentTarget;
                      if (field.selectionStart !== 0 || field.selectionEnd !== 0) return;
                      remember(true);
                      line.symbols = showText[2] ?? "";
                      revealErrors = false;
                      saveChange();
                      event.preventDefault();
                    }),
                    on("input", (event) => {
                      if (readOnly) return;
                      remember(true);
                      let typed = event.currentTarget.value;
                      line.symbols = showText ? `${showText[1]}${typed}` : typed;
                      revealErrors = false;
                      saveChange();
                    }),
                  ]}
                  aria-label="Formula"
                  data-line={index}
                  placeholder={omitsFormula(line) ? "" : "Formula"}
                  readOnly={readOnly}
                  type="text"
                  value={showText ? showText[2] : line.symbols}
                />
              </div>
            );
          })()}
            {revealErrors && checked?.error ? (
              <span
                aria-label={checked.error}
                mix={[
                  css({
                    position: "absolute",
                    top: "0px",
                    right: t.space.sm,
                    bottom: "0px",
                    zIndex: "2",
                    display: "flex",
                    alignItems: "center",
                    color: t.colors.text.warning,
                    cursor: "help",
                  }),
                  on("pointerenter", (event) => {
                    let box = event.currentTarget.getBoundingClientRect();
                    errorTip = checked.error ?? "";
                    errorTipX = box.left + box.width / 2;
                    errorTipY = box.top;
                    handle.update();
                  }),
                  on("pointerleave", () => {
                    errorTip = "";
                    handle.update();
                  }),
                ]}
              >
                <Icon icon={CircleAlert} mix={css({ width: t.space.xl, height: t.space.xl })} />
              </span>
            ) : null}
          </div>
          <input
            mix={[
              lineField,
              css({
                gridColumn: "3",
                gridRow: placed,
                paddingBlock: t.space.sm,
                paddingInline: t.space.sm,
                color: checked?.error ? t.colors.text.warning : t.colors.text.primary,
              }),
              ...watchLine(index),
              on("focus", () => {
                beginEdit(index);
              }),
              on("blur", () => {
                endEdit(index);
              }),
              on("input", (event) => {
                if (readOnly) return;
                remember(true);
                line.annotation = event.currentTarget.value;
                line.entered = false;
                revealErrors = false;
                saveChange();
              }),
              on("keydown", (event) => {
                if (readOnly || event.key !== "Enter") return;
                event.preventDefault();
                remember(true);
                line.entered = true;
                let symbols = inferSymbols(problem.problem, lines, index);
                if (symbols !== null) line.symbols = symbols;
                let next = checkDerivation(problem.problem, lines);
                if (finished(lines, next.lines, index)) focusAnnotation = index + 1;
                saveChange();
              }),
            ]}
            aria-label="Annotation"
            data-annotation={index}
            data-line={index}
            placeholder="Annotation"
            readOnly={readOnly}
            title={checked?.error ?? ""}
            type="text"
            value={line.annotation}
          />
          {!readOnly ? (
            <span
              data-line={index}
              mix={[
                css({
                  gridColumn: "4",
                  gridRow: placed,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.space.xs,
                  marginLeft: `calc(${t.space.md} * -1)`,
                  paddingLeft: t.space.md,
                  paddingRight: t.space.md,
                  opacity: hoverLine === index ? "1" : "0",
                }),
                ...watchLine(index),
              ]}
            >
              <button
                type="button"
                aria-label="Insert line before"
                title="Insert line before"
                mix={[
                  lineAction,
                  on("click", () => {
                    insertLine(index);
                  }),
                ]}
              >
                <Icon icon={ArrowUpToLine} mix={css({ width: t.space.xl, height: t.space.xl })} />
              </button>
              <button
                type="button"
                aria-label="Insert line after"
                title="Insert line after"
                mix={[
                  lineAction,
                  on("click", () => {
                    insertLine(index + 1);
                  }),
                ]}
              >
                <Icon icon={ArrowDownToLine} mix={css({ width: t.space.xl, height: t.space.xl })} />
              </button>
              <button
                type="button"
                aria-label="Delete line"
                title="Delete line"
                mix={[
                  lineAction,
                  on("click", () => {
                    removeLine(index);
                  }),
                ]}
              >
                <Icon icon={Trash2} mix={css({ width: t.space.xl, height: t.space.xl })} />
              </button>
            </span>
          ) : null}
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
      let nodes = [
        <span
          key="formula-header"
          mix={css({
            gridColumn: "2",
            gridRow: "1",
            paddingLeft: t.space.sm,
            paddingBottom: t.space.xs,
            color: t.colors.text.muted,
            fontSize: t.fontSize.sm,
            lineHeight: t.lineHeight.normal,
          })}
        >
          Formula
        </span>,
        <span
          key="annotation-header"
          mix={css({
            gridColumn: "3",
            gridRow: "1",
            paddingInline: t.space.sm,
            paddingBottom: t.space.xs,
            color: t.colors.text.muted,
            fontSize: t.fontSize.sm,
            lineHeight: t.lineHeight.normal,
          })}
        >
          Annotation
        </span>,
      ];
      let rowNumber = 2;
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
        mix={[
          css({
            width: t.size.full,
            ...sectionPadding,
          }),
          on("keydown", (event) => {
            let command = event.metaKey || event.ctrlKey;
            if (!command || event.key.toLowerCase() !== "z") return;
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
          }),
        ]}
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
              position: "relative",
              zIndex: "4",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: t.space.md,
            })}
          >
          <h2
            mix={[
              css({
                margin: 0,
                color: t.colors.text.secondary,
                fontSize: t.fontSize.lg,
                fontWeight: t.fontWeight.semibold,
                lineHeight: t.lineHeight.normal,
                whiteSpace: "nowrap",
              }),
            ]}
          >
            Derivation {problem.number}
          </h2>
          <div
            mix={css({
              position: "relative",
              zIndex: "4",
              display: "flex",
              flexShrink: "0",
              flexDirection: "row",
              gap: t.space.sm,
            })}
          >
            <div
              mix={[
                css({
                  position: "relative",
                  display: "flex",
                }),
                ref((node, signal) => {
                  let closeOnOutside = (event: PointerEvent) => {
                    if (!helpOpen) return;
                    if (event.target instanceof Node && node.contains(event.target)) return;
                    helpOpen = false;
                    handle.update();
                  };
                  document.addEventListener("pointerdown", closeOnOutside);
                  signal.addEventListener("abort", () => {
                    document.removeEventListener("pointerdown", closeOnOutside);
                  });
                }),
              ]}
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
                Command Reference
              </button>
              {helpOpen ? (
                <div
                  mix={css({
                    position: "absolute",
                    top: "100%",
                    right: "0px",
                    zIndex: "2",
                    width: "46rem",
                    maxHeight: "70vh",
                    overflow: "auto",
                    marginTop: t.space.sm,
                    paddingBlock: t.space.sm,
                    backgroundColor: t.surface.lvl0,
                    boxShadow: t.shadow.md,
                    fontSize: t.fontSize.sm,
                    lineHeight: t.lineHeight.normal,
                  })}
                >
                  {["Begin a derivation", "Logical operations", "Completing a derivation", "Begin a subderivation"].map((group) => (
                    <div key={group}>
                      <div
                        mix={css({
                          margin: 0,
                          paddingInline: t.space.md,
                          paddingTop: t.space.lg,
                          paddingBottom: t.space.sm,
                          color: t.colors.text.primary,
                          fontSize: t.fontSize.sm,
                          fontWeight: t.fontWeight.semibold,
                          lineHeight: t.lineHeight.normal,
                        })}
                      >
                        {group}
                      </div>
                      {ruleHelp.filter((rule) => rule.group === group).map((rule) => {
                    let open = helpOpenRules.has(rule.name);
                    return (
                      <div key={rule.name}>
                        <button
                          type="button"
                          mix={[
                            css({
                              display: "grid",
                              gridTemplateColumns: "12rem minmax(0, 1fr)",
                              alignItems: "start",
                              columnGap: t.space.lg,
                              width: "100%",
                              margin: 0,
                              paddingInline: t.space.md,
                              paddingBlock: t.space.xs,
                              border: "none",
                              backgroundColor: "transparent",
                              color: "#111827",
                              font: "inherit",
                              fontSize: t.fontSize.sm,
                              fontWeight: t.fontWeight.normal,
                              lineHeight: t.lineHeight.normal,
                              textAlign: "left",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#e4eef8" },
                            }),
                            on("click", () => {
                              if (helpOpenRules.has(rule.name)) helpOpenRules.delete(rule.name);
                              else helpOpenRules.add(rule.name);
                              handle.update();
                            }),
                          ]}
                        >
                          <span
                            mix={css({
                              display: "flex",
                              alignItems: "center",
                              gap: t.space.sm,
                            })}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              aria-hidden="true"
                              mix={css({
                                display: "block",
                                width: "12px",
                                height: "12px",
                                flexShrink: "0",
                              })}
                            >
                              <path
                                d={
                                  open
                                    ? "M2.4 5.1 L8 11.2 L13.6 5.1 L13.6 6.7 L8 12.8 L2.4 6.7 Z"
                                    : "M5.1 2.4 L11.2 8 L5.1 13.6 L6.7 13.6 L12.8 8 L6.7 2.4 Z"
                                }
                                fill="#111827"
                              />
                            </svg>
                            {rule.command}
                          </span>
                          <span mix={css({ color: "#111827" })}>{rule.does}</span>
                        </button>
                        {open ? <HelpSample lines={rule.lines} /> : null}
                      </div>
                    );
                      })}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              disabled={past.length === 0}
              mix={[
                action,
                on("click", () => undo()),
              ]}
            >
              <Icon icon={Undo2} mix={css({ width: t.space.xl, height: t.space.xl })} />
              Undo
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              mix={[
                action,
                on("click", () => redo()),
              ]}
            >
              <Icon icon={Redo2} mix={css({ width: t.space.xl, height: t.space.xl })} />
              Redo
            </button>
            <button
              type="button"
              mix={[
                action,
                on("click", () => {
                  revealErrors = true;
                  let logicCorrect = result.lines.every((line) => !line.error);
                  showNotice(
                    logicCorrect && result.complete
                      ? "Logic is correct and complete"
                      : logicCorrect
                        ? "Logic is correct"
                        : result.complete
                          ? "Logic is complete"
                          : "Logic is incorrect",
                    logicCorrect && result.complete ? "success" : logicCorrect ? "partial" : "neutral",
                  );
                  saveChange(result.complete && logicCorrect ? "correct" : "incorrect");
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
                  remember(false);
                  lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
                  collapsed = new Set();
                  hoverLine = null;
                  citeHover = null;
                  editingLine = null;
                  if (citeTimer) clearTimeout(citeTimer);
                  citeTimer = null;
                  revealErrors = false;
                  hideNotice();
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
                    submitAction,
                    on("click", () => {
                      if (!result.complete) {
                        showNotice("Submit needs a finished derivation.", "neutral");
                        handle.update();
                        return;
                      }
                      showNotice("Submission Successful!", "success");
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
          {parts ? (
            <div
              mix={css({
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "flex-start",
                gap: t.space.xl,
                color: t.colors.text.primary,
                fontSize: t.fontSize.lg,
                lineHeight: t.lineHeight.normal,
              })}
            >
              {parts.premises.map((premise, index) => (
                <span
                  mix={css({
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: t.space.xs,
                  })}
                >
                  <span
                    mix={css({
                      backgroundColor: citedPremise() === index + 1 ? "#f8efe0" : "transparent",
                    })}
                  >
                    {premise}.
                  </span>
                  <span mix={css({ color: t.colors.text.muted, fontSize: t.fontSize.sm })}>
                    pr{index + 1}
                  </span>
                </span>
              ))}
              <span
                mix={css({
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: t.space.xs,
                })}
              >
                <span>∴ {parts.conclusion}</span>
                <span mix={css({ color: t.colors.text.muted, fontSize: t.fontSize.sm })}>
                  conc
                </span>
              </span>
            </div>
          ) : (
            <p
              mix={css({
                margin: 0,
                color: t.colors.text.primary,
                fontSize: t.fontSize.lg,
                lineHeight: t.lineHeight.normal,
              })}
            >
              {problemStatement(problem)}
            </p>
          )}
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
        {errorTip ? (
          <span
            mix={css({
              position: "fixed",
              left: `${errorTipX}px`,
              top: `${errorTipY}px`,
              transform: "translate(-50%, calc(-100% - 6px))",
              zIndex: "40",
              maxWidth: "16rem",
              paddingInline: t.space.sm,
              paddingBlock: t.space.xs,
              borderRadius: t.radius.sm,
              backgroundColor: t.colors.text.primary,
              color: "#ffffff",
              fontSize: t.fontSize.xs,
              fontWeight: t.fontWeight.normal,
              lineHeight: t.lineHeight.normal,
              pointerEvents: "none",
            })}
          >
            {errorTip}
          </span>
        ) : null}
        {notice ? (
          <div
            mix={css({
              position: "fixed",
              zIndex: "50",
              top: t.space.md,
              left: "50%",
              transform: "translateX(-50%)",
              opacity: noticeFade ? "0" : "1",
              transition: "opacity 500ms ease",
              paddingInline: t.space.lg,
              paddingBlock: t.space.md,
              borderRadius: t.radius.md,
              backgroundColor:
                noticeTone === "success" ? "#16a34a" : noticeTone === "partial" ? "#eab308" : t.colors.text.primary,
              color: noticeTone === "partial" ? "#111827" : noticeTone === "success" ? "#ffffff" : t.surface.lvl0,
              fontSize: t.fontSize.sm,
              lineHeight: t.lineHeight.normal,
              whiteSpace: "nowrap",
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

