import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { sectionPadding } from "#app/components/Welcome.tsx";
import { assignmentProblemList } from "#app/data/assignments.ts";
import { problemId, problemLabel } from "#app/data/problems.ts";
import { routes } from "#app/routes.ts";
import { t } from "#app/theme.ts";

export interface AssignmentProps {
  name: string;
  slug: string;
}

export function Assignment(handle: Handle<AssignmentProps>) {
  return () => {
    let items = assignmentProblemList(handle.props.slug);

    return (
      <main
        mix={[
          css({
            width: t.size.full,
            flex: "1",
            minHeight: t.size.full,
            ...sectionPadding,
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
              paddingBottom: t.space.md,
              fontSize: t.fontSize.md,
              fontWeight: t.fontWeight.normal,
            }),
          ]}
        >
          {handle.props.name}
        </h2>
        <ul
          mix={[
            css({
              margin: 0,
              padding: 0,
              listStyle: "none",
              fontSize: t.fontSize.md,
              lineHeight: t.lineHeight.normal,
            }),
          ]}
        >
          {items.map((item) => (
            <li key={problemId(item.type, item.number)}>
              <a
                href={routes.assignment.problem.href({
                  name: handle.props.slug,
                  type: item.type,
                  problem: item.number,
                })}
                data-rmx-src={routes.assignment.problemContent.href({
                  name: handle.props.slug,
                  type: item.type,
                  problem: item.number,
                })}
                data-rmx-target="module"
                mix={css({
                  display: "block",
                  width: t.size.full,
                  paddingBlock: t.space.sm,
                  color: t.colors.choice.ink,
                  textDecoration: "none",
                  "&:hover": { backgroundColor: "#e4eef8" },
                })}
              >
                {problemLabel(item, "typed")}
              </a>
            </li>
          ))}
        </ul>
      </main>
    );
  };
}
