import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { t } from "#app/theme.ts";

export interface AssignmentProps {
  name: string;
}

const rows = [
  { problem: "Pars 1.001", comment: "", points: "1", evaluation: "C", submitted: "Tue, 9/15/2026 1:33 PM" },
  { problem: "Pars 1.002", comment: "", points: "1", evaluation: "C", submitted: "Tue, 9/15/2026 1:33 PM" },
  { problem: "Symb 1.001", comment: "", points: "1", evaluation: "C", submitted: "Tue, 9/15/2026 1:45 PM" },
];

const cell = css({
  paddingInline: t.space.md,
  paddingBlock: t.space.sm,
  textAlign: "left",
  whiteSpace: "nowrap",
  fontWeight: t.fontWeight.normal,
  color: t.colors.text.primary,
  borderBottomWidth: t.space.px,
  borderBottomStyle: "solid",
  borderBottomColor: t.colors.border.subtle,
});

export function Assignment(handle: Handle<AssignmentProps>) {
  return () => (
    <main
      mix={[
        css({
          flex: "1",
          minHeight: t.size.full,
          paddingInline: t.space.lg,
          paddingTop: t.space.xxl,
          paddingBottom: t.space.xl,
          overflow: "auto",
          fontFamily: t.fontFamily.sans,
          color: t.colors.text.primary,
        }),
      ]}
    >
      <h2
        mix={[
          css({
            margin: 0,
            paddingInline: t.space.sm,
            paddingBottom: t.space.md,
            fontSize: t.fontSize.md,
            fontWeight: t.fontWeight.normal,
          }),
        ]}
      >
        {handle.props.name}
      </h2>
      <table
        mix={[
          css({
            width: "max-content",
            borderCollapse: "collapse",
            fontSize: t.fontSize.md,
            lineHeight: t.lineHeight.normal,
          }),
        ]}
      >
        <thead>
          <tr>
            {["Problem Name", "Comment", "Points", "Evaluation", "Submission Date"].map((heading) => (
              <th key={heading} mix={cell}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.problem}>
              <td mix={cell}>{row.problem}</td>
              <td mix={cell}>{row.comment}</td>
              <td mix={cell}>{row.points}</td>
              <td mix={cell}>{row.evaluation}</td>
              <td mix={cell}>{row.submitted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
