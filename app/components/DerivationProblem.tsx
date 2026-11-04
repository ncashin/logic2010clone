import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import type { Problem } from "#app/components/ProblemList.tsx";
import { t } from "#app/theme.ts";

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
  return () => {
    let { problem } = handle.props;

    return (
      <div mix={css({ paddingInline: t.space.xl, paddingBlock: t.space.lg,  })}>
        <h2
          mix={[
            css({
              margin: 0,
              paddingInline: t.space.sm,
              paddingBottom: t.space.md,

              color: t.colors.text.primary,
              fontSize: t.fontSize.md,
              fontWeight: t.fontWeight.normal,
              lineHeight: t.lineHeight.normal,
            }),
          ]}
        >
          Derivation {problem.number}: {problem.problem}
        </h2>
        <DerivationRow lineNumber={1} />
        
      </div>
    );
  };
}

export interface DerivationRowProps {
  lineNumber: number;
}

function DerivationRow(handle: Handle<DerivationRowProps>) {
  return () => {
    let { lineNumber } = handle.props;

    return (
      <div
        mix={css({
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: t.space.md,
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
            "&:hover": {
              backgroundColor: t.surface.lvl1,
            },
          })}
        >
          <h2
            mix={[
              css({
                margin: 0,
                color: t.colors.text.primary,
                fontSize: t.fontSize.md,
                fontWeight: t.fontWeight.normal,
                lineHeight: t.lineHeight.normal,
              }),
            ]}
          >
            {lineNumber}.
          </h2>
          <input mix={[lineField, css({ flex: "1" })]} placeholder="Symbols" type="text" />
        </div>
        <input
          mix={[
            lineField,
            css({
              paddingInline: t.space.sm,
              "&:hover": {
                backgroundColor: t.surface.lvl1,
              },
            }),
          ]}
          placeholder="Annotation"
          type="text"
        />
      </div>
    );
  };
}