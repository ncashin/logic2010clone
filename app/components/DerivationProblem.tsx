import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Ellipsis,
  Redo2,
  Trash2,
  Undo2,
} from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import { problemOnAssignment } from "#app/data/assignments.ts";
import { problemStatement, type Problem } from "#app/data/problems.ts";
import { getProgress, peekProgress, writeProgress } from "#app/data/progress.ts";
import { Icon } from "#app/components/Icon.tsx";
import {
  type DerivationLine,
  annotationCites,
  checkDerivation,
  simpleAnnotations,
  formatFormula,
  inferSymbols,
  parseArgument,
} from "#app/logic/derivation.ts";
import { sectionPadding } from "#app/components/Welcome.tsx";
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

const ruleHelp: Record<string, { taken: string; text: string }> = {
  pr: { taken: "pr1", text: "A premise from the problem." },
  "ass cd": { taken: "ass cd", text: "Assume the if-part." },
  "ass id": { taken: "ass id", text: "Assume the opposite." },
  r: { taken: "1 r", text: "Copy an earlier line." },
  mp: { taken: "1 2 mp", text: "From P and P→Q, get Q." },
  mt: { taken: "1 2 mt", text: "From ~Q and P→Q, get ~P." },
  dn: { taken: "1 dn", text: "Cancel two nots." },
  cd: { taken: "1 cd", text: "Done when the then-part is shown." },
  id: { taken: "1 2 id", text: "Done when a line and its opposite both appear." },
  dd: { taken: "1 dd", text: "Done when the shown line is copied." },
  "show conc": { taken: "show conc", text: "Start the conclusion." },
  "show cons": { taken: "show cons", text: "Start the then-part." },
  "show ant": { taken: "show ant 1", text: "Start the if-part." },
  "show negcons": { taken: "show negcons 1", text: "Start the opposite of the then-part." },
  "show unneg": { taken: "show unneg 1", text: "Start the formula under the not." },
};

const sampleDerivation = [
  { number: "1", formula: "Show Q", annotation: "show conc", depth: 0, strike: true },
  { number: "2", formula: "P→Q", annotation: "pr1", depth: 1 },
  { number: "3", formula: "~~P", annotation: "pr2", depth: 1 },
  { number: "4", formula: "P", annotation: "3 dn", depth: 1 },
  { number: "5", formula: "Q", annotation: "2 4 mp", depth: 1, closes: true },
];

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
  let revealErrors = false;
  let focusAnnotation: number | null = null;
  let collapsed = new Set<number>();
  let hoverLine: number | null = null;
  let citeHover: number | null = null;
  let dirty = false;
  let helpOpen = false;
  let past: string[] = [];
  let future: string[] = [];
  let typing = false;
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
    return writeProgress(problem.type, problem.number, {
      status: status ?? (hasWork(lines) ? "in-progress" : "unattempted"),
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
    notice = "";
    saveChange();
  }

  function redo() {
    let saved = future.pop();
    if (!saved) return;
    past.push(snapshot());
    restoreSnapshot(saved);
    revealErrors = false;
    notice = "";
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
      notice = "";
      revealErrors = false;
      collapsed = new Set();
      hoverLine = null;
      citeHover = null;
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
      if (citeHover == null || citeHover === index) return false;
      return annotationCites(active[citeHover]?.annotation ?? "").includes(index + 1);
    }

    function renderRow(index: number, line: DerivationLine, rowNumber: number) {
      let checked = activeResult.lines[index];
      let showCaret = checked?.boxed != null && hoverLine === index;
      let cited = citedByHover(index);
      let citedMark = cited ? { backgroundColor: "#e4eef8" } : {};
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
                  remember(false);
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
                ...citedMark,
              }),
            ]}
          >
            {boxGuides(index)}
            {(() => {
            let showText = /^(\s*show\b)(.*)$/i.exec(line.symbols);
            let crossed = Boolean(checked?.show && checked.boxed && showText);
            return (
              <div mix={css({ display: "flex", flexDirection: "row", alignItems: "center", minWidth: "0" })}>
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
                      ...citedMark,
                      "&:hover": { backgroundColor: t.surface.lvl1 },
                    }),
                    ...watchLine(index),
                    on("focus", () => {
                      typing = false;
                    }),
                    on("input", (event) => {
                      if (readOnly) return;
                      remember(true);
                      let typed = event.currentTarget.value;
                      line.symbols = crossed && showText ? `${showText[1]}${typed}` : typed;
                      revealErrors = false;
                      saveChange();
                    }),
                  ]}
                  data-line={index}
                  placeholder={line.depth > 0 ? "" : "Formula"}
                  readOnly={readOnly}
                  type="text"
                  value={crossed && showText ? showText[2] : line.symbols}
                />
              </div>
            );
          })()}
            {revealErrors && checked?.error ? (
              <span
                mix={css({
                  position: "absolute",
                  top: "0px",
                  right: t.space.sm,
                  bottom: "0px",
                  display: "flex",
                  alignItems: "center",
                  color: t.colors.text.warning,
                  "&:hover > span": { display: "block" },
                })}
              >
                <Icon icon={CircleAlert} mix={css({ width: t.space.xl, height: t.space.xl })} />
                <span
                  mix={css({
                    display: "none",
                    position: "absolute",
                    top: "100%",
                    right: "0px",
                    zIndex: "3",
                    width: "16rem",
                    padding: t.space.sm,
                    backgroundColor: t.surface.lvl0,
                    boxShadow: t.shadow.md,
                    color: t.colors.text.primary,
                    fontSize: t.fontSize.sm,
                    lineHeight: t.lineHeight.normal,
                  })}
                >
                  {checked.error}
                </span>
              </span>
            ) : null}
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
              on("mouseenter", () => {
                citeHover = index;
                handle.update();
              }),
              on("mouseleave", () => {
                if (citeHover === index) citeHover = null;
                handle.update();
              }),
              on("focus", () => {
                typing = false;
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
                remember(false);
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
                fontWeight: t.fontWeight.normal,
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
                    width: "32rem",
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
                  <div
                    mix={css({
                      marginBottom: t.space.lg,
                      padding: t.space.md,
                      backgroundColor: t.surface.lvl1,
                    })}
                  >
                    <div mix={css({ marginBottom: t.space.sm, color: t.colors.text.muted })}>
                      P→Q. ~~P ∴ Q
                    </div>
                    {sampleDerivation.map((line) => (
                      <div
                        key={line.number}
                        mix={css({
                          display: "grid",
                          gridTemplateColumns: "1.25rem 1fr 5.5rem",
                          columnGap: t.space.sm,
                          alignItems: "center",
                          paddingLeft: `${line.depth * 12}px`,
                        })}
                      >
                        <span mix={css({ textAlign: "right", color: t.colors.text.muted })}>
                          {line.number}
                        </span>
                        <span
                          mix={css({
                            textDecoration: line.strike ? "line-through" : "none",
                            boxShadow: line.closes ? `inset -2px 0 0 ${t.colors.text.primary}` : "none",
                          })}
                        >
                          {line.formula}
                        </span>
                        <span mix={css({ color: t.colors.text.secondary })}>{line.annotation}</span>
                      </div>
                    ))}
                  </div>
                  {simpleAnnotations.map((rule) => {
                    let help = ruleHelp[rule.name];
                    return (
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
                        <div>{help?.taken}</div>
                        <div mix={css({ color: t.colors.text.muted })}>{rule.symbols}</div>
                      </div>
                      <div>{help?.text}</div>
                    </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button type="button" mix={[action]}>
              Feedback
            </button>
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
                  notice = result.complete ? "Checked: complete." : "Checked: incomplete.";
                  saveChange(result.complete ? "correct" : "incorrect");
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
                  revealErrors = false;
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
                  {premise}.
                  <span mix={css({ color: t.colors.text.muted, fontSize: t.fontSize.sm })}>
                    pr{index + 1}
                  </span>
                </span>
              ))}
              <span>∴ {parts.conclusion}</span>
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
