import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import type { Problem } from "#app/components/ProblemList.tsx";
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

  return () => {
    let { problem } = handle.props;
    if (loaded !== problem.number) {
      loaded = problem.number;
      lines = [{ symbols: "", annotation: "", depth: 0, entered: false }];
      notice = "";
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

    function renderLines(start: number, end: number, baseDepth: number) {
      let nodes = [];
      for (let index = start; index < end; ) {
        let line = lines[index];
        let checked = result.lines[index];
        if (!line) break;
        if (checked?.boxed) {
          let boxDepth = line.depth + 1;
          let stop = index + 1;
          while (stop < end && (lines[stop]?.depth ?? 0) >= boxDepth) stop += 1;
          nodes.push(renderLine(index, line.depth - baseDepth, baseDepth > 0));
          nodes.push(
            <div
              key={`box-${index}`}
              mix={css({
                marginLeft: `${(boxDepth - baseDepth) * 24}px`,
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: t.colors.text.primary,
              })}
            >
              {renderLines(index + 1, stop, boxDepth)}
            </div>,
          );
          index = stop;
          continue;
        }
        nodes.push(renderLine(index, line.depth - baseDepth, baseDepth > 0));
        index += 1;
      }
      return nodes;
    }

    function renderLine(index: number, indent: number, inBox: boolean) {
      let line = lines[index];
      let checked = result.lines[index];
      if (!line) return null;
      return (
        <div
          key={index}
          mix={css({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: t.space.md,
            marginLeft: `${indent * 24}px`,
          })}
        >
          <div
            mix={css({
              display: "flex",
              flex: "1",
              flexDirection: "row",
              alignItems: "center",
              gap: t.space.md,
              paddingInline: t.space.sm,
              "&:hover": { backgroundColor: t.surface.lvl1 },
            })}
          >
            <h2
              mix={css({
                margin: 0,
                color: t.colors.text.primary,
                fontSize: t.fontSize.md,
                fontWeight: t.fontWeight.normal,
                lineHeight: t.lineHeight.normal,
              })}
            >
              {index + 1}.
            </h2>
            <input
              mix={[
                lineField,
                css({ flex: "1" }),
                on("input", (event) => {
                  line.symbols = event.currentTarget.value;
                  handle.update();
                }),
              ]}
              placeholder={inBox ? "" : "Symbols"}
              type="text"
              value={line.symbols}
            />
          </div>
          <input
            mix={[
              lineField,
              css({
                paddingInline: t.space.sm,
                color: checked?.error ? t.colors.text.warning : t.colors.text.primary,
                "&:hover": { backgroundColor: t.surface.lvl1 },
              }),
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
            placeholder="Annotation"
            title={checked?.error ?? ""}
            type="text"
            value={line.annotation}
          />
        </div>
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
        {renderLines(0, lines.length, 0)}
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
