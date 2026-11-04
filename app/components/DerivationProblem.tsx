import { ChevronDown, ChevronRight } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import type { Problem } from "#app/components/ProblemList.tsx";
import { Icon } from "#app/components/Icon.tsx";
import {
  type DerivationLine,
  checkDerivation,
  inferSymbols,
} from "#app/logic/derivation.ts";
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

export function DerivationProblem(handle: Handle<DerivationProblemProps>) {
  let loaded = "";
  let lines: DerivationLine[] = [];
  let notice = "";
  let focusAnnotation: number | null = null;
  let collapsed = new Set<number>();
  let hoverLine: number | null = null;

  return () => {
    let { problem } = handle.props;
    if (loaded !== problem.number) {
      loaded = problem.number;
      lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
      notice = "";
      collapsed = new Set();
      hoverLine = null;
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

    function bodyRange(showIndex: number) {
      let boxDepth = (lines[showIndex]?.depth ?? 0) + 1;
      let stop = showIndex + 1;
      while (stop < lines.length && (lines[stop]?.depth ?? 0) >= boxDepth) stop += 1;
      return { start: showIndex + 1, stop };
    }

    function containingShows(index: number) {
      let shows: number[] = [];
      for (let show of collapsed) {
        if (index > show && index < bodyRange(show).stop) shows.push(show);
      }
      return shows;
    }

    function derivationRows() {
      let rows = [];
      let boxes = [];
      for (let index = 0; index < lines.length; index += 1) {
        let line = lines[index];
        let checked = result.lines[index];
        if (!line || containingShows(index).length > 0) continue;
        rows.push(renderLine(index, line));
        if (!checked?.boxed) continue;
        if (collapsed.has(index)) {
          rows.push(
            <div
              key={`ellipsis-${index}`}
              mix={css({
                gridColumn: "2",
                gridRow: `${index + 2}`,
                marginLeft: `${(line.depth + 1) * 24}px`,
                color: t.colors.text.primary,
                textDecoration: "underline",
              })}
            >
              ...
            </div>,
          );
          continue;
        }
        let range = bodyRange(index);
        boxes.push(
          <div
            key={`box-${index}`}
            mix={css({
              position: "absolute",
              gridColumn: "2",
              gridRow: `${index + 1} / ${range.stop + 1}`,
              zIndex: "1",
              top: "12px",
              right: "0px",
              bottom: "0px",
              left: `${(line.depth + 1) * 24}px`,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: t.colors.text.primary,
              backgroundColor: "transparent",
              pointerEvents: "none",
            })}
          />,
        );
      }
      return (
        <div
          mix={css({
            display: "grid",
            position: "relative",
            gridTemplateColumns: "auto minmax(0, 1fr) minmax(8rem, 14rem)",
            alignItems: "center",
            columnGap: t.space.md,
          })}
        >
          {rows}
          {boxes}
        </div>
      );
    }

    function formulaCell(index: number, line: DerivationLine, row: string) {
      return (
        <div
          key={`s-${index}`}
          mix={css({
            gridColumn: "2",
            gridRow: row,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: `${line.depth * 24}px`,
          })}
        >
          <input
            mix={[
              lineField,
              css({
                flex: "1",
                minWidth: "0",
                paddingLeft: t.space.sm,
                "&:hover": { backgroundColor: t.surface.lvl1 },
              }),
              ...watchLine(index),
              on("input", (event) => {
                line.symbols = event.currentTarget.value;
                handle.update();
              }),
            ]}
            placeholder={line.depth > 0 ? "" : "Formula"}
            data-line={index}
            type="text"
            value={line.symbols}
          />
        </div>
      );
    }

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

    function renderLine(index: number, line: DerivationLine) {
      let checked = result.lines[index];
      let row = `${index + 1}`;
      let showCaret = checked?.boxed != null && hoverLine === index;
      return (
        <>
          {showCaret ? (
            <button
              key={`n-${index}`}
              type="button"
              aria-label={collapsed.has(index) ? "Open derivation" : "Close derivation"}
              data-line={index}
              mix={[
                css({
                  gridColumn: "1",
                  gridRow: row,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  margin: 0,
                  paddingInline: t.space.sm,
                  border: "none",
                  backgroundColor: "transparent",
                  color: t.colors.text.primary,
                  cursor: "pointer",
                }),
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
              key={`n-${index}`}
              data-line={index}
              mix={[
                css({
                  gridColumn: "1",
                  gridRow: row,
                  margin: 0,
                  paddingInline: t.space.sm,
                  color: t.colors.text.primary,
                  fontSize: t.fontSize.md,
                  fontWeight: t.fontWeight.normal,
                  lineHeight: t.lineHeight.normal,
                  textAlign: "right",
                }),
                ...watchLine(index),
              ]}
            >
              {index + 1}.
            </h2>
          )}
          {formulaCell(index, line, row)}
          <input
            key={`a-${index}`}
            mix={[
              lineField,
              css({
                gridColumn: "3",
                gridRow: row,
                paddingInline: t.space.sm,
                color: checked?.error ? t.colors.text.warning : t.colors.text.primary,
                "&:hover": { backgroundColor: t.surface.lvl1 },
              }),
              ...watchLine(index),
              on("input", (event) => {
                line.annotation = event.currentTarget.value;
                line.entered = false;
                handle.update();
              }),
              on("keydown", (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                line.entered = true;
                let symbols = inferSymbols(problem.problem, lines, index);
                if (symbols) line.symbols = symbols;
                let next = checkDerivation(problem.problem, lines);
                if (finished(next.lines, index)) focusAnnotation = index + 1;
                handle.update();
              }),
            ]}
            data-annotation={index}
            data-line={index}
            placeholder="Annotation"
            title={checked?.error ?? ""}
            type="text"
            value={line.annotation}
          />
        </>
      );
    }

    return (
      <div mix={css({ paddingInline: t.space.xl, paddingBlock: t.space.lg })}>
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
                paddingInline: t.space.sm,
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
                  notice = result.complete ? "Checked: complete." : "";
                  handle.update();
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
                  notice = result.complete ? "Submitted." : "Submit needs a finished derivation.";
                  handle.update();
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
        {derivationRows()}
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
