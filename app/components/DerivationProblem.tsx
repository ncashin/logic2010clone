import { ChevronDown, ChevronRight, Ellipsis } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import type { Problem } from "#app/data/problems.ts";
import { getProgress, writeProgress } from "#app/data/progress.ts";
import { Icon } from "#app/components/Icon.tsx";
import {
  type DerivationLine,
  checkDerivation,
  inferSymbols,
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
    handle.update();
  }

  function persist(
    status?: "unattempted" | "in-progress" | "incorrect" | "correct",
    submitted?: boolean,
  ) {
    let { problem } = handle.props;
    return writeProgress(problem.type, problem.number, {
      status: status ?? (hasWork(lines) ? "in-progress" : "unattempted"),
      work: JSON.stringify(lines),
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
      lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
      notice = "";
      collapsed = new Set();
      hoverLine = null;
      dirty = false;
      void restore(problem);
    }

    function finished(checkedLines: ReturnType<typeof checkDerivation>["lines"], index: number) {
      let line = lines[index];
      let checked = checkedLines[index];
      if (!line || !checked || checked.error) return false;
      if (checked.closesShow) return true;
      return checked.formula !== null && line.annotation.trim() !== "";
    }

    let result = checkDerivation(problem.problem, lines);
    let last = lines.at(-1);
    let lastIndex = lines.length - 1;
    if (
      last &&
      lastIndex > 0 &&
      last.symbols.trim() === "" &&
      last.annotation.trim() === "" &&
      !finished(result.lines, lastIndex - 1)
    ) {
      lines.pop();
      result = checkDerivation(problem.problem, lines);
      last = lines.at(-1);
      lastIndex = lines.length - 1;
    }
    if (last && finished(result.lines, lastIndex) && (last.symbols.trim() !== "" || last.annotation.trim() !== "")) {
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
      let checked = result.lines[index];
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
                      let typed = event.currentTarget.value;
                      line.symbols = crossed && showText ? `${showText[1]}${typed}` : typed;
                      saveChange();
                    }),
                  ]}
                  data-line={index}
                  placeholder={line.depth > 0 ? "" : "Formula"}
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
              }),
              ...watchLine(index),
              on("input", (event) => {
                line.annotation = event.currentTarget.value;
                line.entered = false;
                saveChange();
              }),
              on("keydown", (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                line.entered = true;
                let symbols = inferSymbols(problem.problem, lines, index);
                if (symbols) line.symbols = symbols;
                let next = checkDerivation(problem.problem, lines);
                if (finished(next.lines, index)) focusAnnotation = index + 1;
                saveChange();
              }),
            ]}
            data-annotation={index}
            data-line={index}
            placeholder="Annotation"
            title={checked?.error ?? ""}
            type="text"
            value={line.annotation}
          />
        </div>
      );
    }

    function boxGuides(index: number) {
      let guides = [];
      let depth = lines[index]?.depth ?? 0;
      for (let show = index - 1; show >= 0 && depth > 0; show -= 1) {
        if ((lines[show]?.depth ?? 0) !== depth - 1) continue;
        let level = depth;
        depth -= 1;
        let stop = show + 1;
        while (stop < lines.length && (lines[stop]?.depth ?? 0) > (lines[show]?.depth ?? 0)) stop += 1;
        let boxed = Boolean(result.lines[show]?.boxed) && !collapsed.has(show);
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
      let depth = lines[index]?.depth ?? 0;
      for (let show = index - 1; show >= 0 && depth > 0; show -= 1) {
        if ((lines[show]?.depth ?? 0) !== depth - 1) continue;
        if (collapsed.has(show)) return true;
        depth -= 1;
      }
      return false;
    }

    function renderTree() {
      let nodes = [];
      let rowNumber = 1;
      for (let index = 0; index < lines.length; index += 1) {
        let line = lines[index];
        if (!line || hidden(index)) continue;
        nodes.push(renderRow(index, line, rowNumber));
        rowNumber += 1;
        if (result.lines[index]?.boxed && collapsed.has(index)) {
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
            mix={[
              css({
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
            Derivation {problem.number}: {problem.problem}
          </h2>
          <div mix={css({ display: "flex", flexShrink: "0", flexDirection: "row", gap: t.space.sm })}>
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
                on("click", () => {
                  if (!result.complete) {
                    notice = "Submit needs a finished derivation.";
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
          </div>
        </div>
        {result.problemError ? (
          <p mix={css({ color: t.colors.text.warning })}>{result.problemError}</p>
        ) : null}
        {renderTree()}
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
