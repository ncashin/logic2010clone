import { css } from "pitlane/theme";
import { type Handle } from "remix/component";

import { assignmentProblemList } from "#app/data/assignments.ts";
import { problems, type ProblemStatus } from "#app/data/problems.ts";
import { listProgress, progressFor, watchProgress } from "#app/data/progress.ts";
import { routes } from "#app/routes.ts";
import { t } from "#app/theme.ts";

export const sectionPadding = {
  paddingInline: t.space.xl,
  paddingTop: t.space.xxl,
  paddingBottom: t.space.xl,
} as const;

const statusColor: Record<ProblemStatus, string> = {
  correct: "#008000",
  incorrect: "#cc0000",
  "in-progress": "#ca8a04",
  unattempted: "#d1d5db",
};

const statusLabel: Record<ProblemStatus, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
  "in-progress": "In progress",
  unattempted: "Not started",
};

const course = [
  ["Section:", "PHIL 2030-001"],
  ["Meets:", "Monday and Wednesday, 11:00-12:15"],
  ["Room:", "Science 214"],
  ["Office hours:", "Tuesday, 2:00-4:00, Arts 118"],
] as const;

const student = [
  ["Institution:", "MUN"],
  ["Term:", "Fall 2026"],
  ["Student ID:", "202614837"],
  ["First Name:", "Jane"],
  ["Middle Name:", "Elizabeth"],
  ["Last Name:", "Doe"],
  ["E-Mail Address:", "jane@example.com"],
] as const;

function headingStyle() {
  return css({
    margin: 0,
    marginBottom: t.space.md,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    lineHeight: t.lineHeight.normal,
  });
}

export function Welcome(handle: Handle) {
  let counts: Record<ProblemStatus, number> = {
    correct: 0,
    incorrect: 0,
    "in-progress": 0,
    unattempted: problems.length,
  };

  handle.queueTask(() => {
    void refresh();
  });
  watchProgress(() => {
    void refresh();
  }, handle.signal);

  async function refresh() {
    let progress = await listProgress();
    let next: Record<ProblemStatus, number> = {
      correct: 0,
      incorrect: 0,
      "in-progress": 0,
      unattempted: 0,
    };
    for (let problem of problems) next[progressFor(progress, problem).status] += 1;
    counts = next;
    handle.update();
  }

  return () => {
    let total = problems.length;
    let nextAssignment = assignmentProblemList("assignment-6")[0];
    let nextHref = nextAssignment
      ? routes.assignment.problem.href({
          name: "assignment-6",
          type: nextAssignment.type,
          problem: nextAssignment.number,
        })
      : routes.assignment.show.href({ name: "assignment-6" });
    let nextContent = nextAssignment
      ? routes.assignment.problemContent.href({
          name: "assignment-6",
          type: nextAssignment.type,
          problem: nextAssignment.number,
        })
      : routes.welcome.show.href();
    let order: ProblemStatus[] = ["correct", "incorrect", "in-progress", "unattempted"];

    function facts(rows: readonly (readonly [string, string])[]) {
      return (
        <dl
          mix={css({
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: t.space.lg,
            rowGap: t.space.xs,
            margin: 0,
            width: "fit-content",
          })}
        >
          {rows.map(([label, value]) => (
            <div key={label} mix={css({ display: "contents" })}>
              <dt mix={css({ margin: 0, textAlign: "right" })}>{label}</dt>
              <dd mix={css({ margin: 0 })}>{value}</dd>
            </div>
          ))}
        </dl>
      );
    }

    return (
      <main
        mix={[
          css({
            ...sectionPadding,
            minHeight: t.size.full,
            fontFamily: t.fontFamily.sans,
            fontSize: t.fontSize.md,
            lineHeight: t.lineHeight.relaxed,
            color: t.colors.text.primary,
            display: "flex",
            flexDirection: "column",
            gap: t.space.xxl,
          }),
        ]}
      >
        <div
          mix={css({
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: t.space.xl,
          })}
        >
          <div
            mix={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: t.space.lg,
            })}
          >
            <h1
              mix={css({
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: t.space.xs,
                margin: 0,
                fontSize: t.fontSize.xl,
                fontWeight: t.fontWeight.bold,
                lineHeight: t.lineHeight.normal,
              })}
            >
              <span mix={css({ whiteSpace: "nowrap" })}>Philosophy 2030: Logic</span>
              <span
                mix={css({
                  fontSize: t.fontSize.md,
                  fontWeight: t.fontWeight.normal,
                  color: t.colors.text.secondary,
                  whiteSpace: "nowrap",
                })}
              >
                Dr. Arthur Sullivan
              </span>
            </h1>
            <section>
              <h2 mix={headingStyle()}>Course Info</h2>
              {facts(course)}
            </section>
          </div>
          <div
            mix={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: t.space.sm,
              marginLeft: "auto",
            })}
          >
            <p
              mix={css({
                margin: 0,
                fontSize: t.fontSize.md,
                textAlign: "right",
              })}
            >
              Next assignment due:{" "}
              <a
                href={nextHref}
                data-rmx-src={nextContent}
                data-rmx-target="module"
                mix={css({
                  color: t.colors.choice.ink,
                  textDecoration: "none",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                })}
              >
                Assignment 6
              </a>{" "}
              Friday November 6th 2026
            </p>
            <p
              mix={css({
                margin: 0,
                fontSize: t.fontSize.sm,
                color: t.colors.text.secondary,
              })}
            >
              {counts.correct} of {total} problems completed
            </p>
            <div
              mix={css({
                display: "flex",
                width: "min(100%, 28rem)",
                height: t.space.lg,
                borderRadius: t.radius.none,
                overflow: "hidden",
                background: statusColor.unattempted,
              })}
            >
              {order.map((status) =>
                counts[status] === 0 ? null : (
                  <div
                    key={status}
                    mix={css({
                      width: `${(counts[status] / total) * 100}%`,
                      background: statusColor[status],
                    })}
                    title={`${statusLabel[status]}: ${counts[status]}`}
                  />
                ),
              )}
            </div>
            <ul
              mix={css({
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: t.space.lg,
                margin: 0,
                padding: 0,
                listStyle: "none",
                fontSize: t.fontSize.sm,
                color: t.colors.text.secondary,
              })}
            >
              {order.map((status) => (
                <li key={status} mix={css({ display: "flex", alignItems: "center", gap: t.space.sm })}>
                  <span
                    mix={css({
                      width: t.space.md,
                      height: t.space.md,
                      borderRadius: t.radius.full,
                      background: statusColor[status],
                    })}
                  />
                  {statusLabel[status]} {counts[status]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section mix={css({ marginTop: "auto" })}>
          <h2 mix={headingStyle()}>Student Info</h2>
          {facts(student)}
        </section>

      </main>
    );
  };
}
