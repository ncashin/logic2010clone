import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

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

const dueDates = [
  { name: "Assignment 1", slug: "assignment-1", year: 2026, month: 9, day: 26, label: "Monday October 26th 2026" },
  { name: "Assignment 2", slug: "assignment-2", year: 2026, month: 9, day: 27, label: "Tuesday October 27th 2026" },
  { name: "Assignment 3", slug: "assignment-3", year: 2026, month: 9, day: 28, label: "Wednesday October 28th 2026" },
  { name: "Assignment 4", slug: "assignment-4", year: 2026, month: 9, day: 29, label: "Thursday October 29th 2026" },
  { name: "Assignment 5", slug: "assignment-5", year: 2026, month: 9, day: 30, label: "Friday October 30th 2026" },
  { name: "Assignment 6", slug: "assignment-6", year: 2026, month: 10, day: 6, label: "Friday November 6th 2026" },
] as const;

function openAssignment(slug: string) {
  let first = assignmentProblemList(slug)[0];
  window.dispatchEvent(
    new CustomEvent("assignment-open", {
      detail: { slug, type: first?.type ?? "", problem: first?.number ?? "" },
    }),
  );
}

function assignmentHref(slug: string) {
  let first = assignmentProblemList(slug)[0];
  return first
    ? {
        href: routes.assignment.problem.href({ name: slug, type: first.type, problem: first.number }),
        content: routes.assignment.problemContent.href({ name: slug, type: first.type, problem: first.number }),
      }
    : {
        href: routes.assignment.show.href({ name: slug }),
        content: routes.welcome.show.href(),
      };
}

export function Welcome(handle: Handle) {
  let counts: Record<ProblemStatus, number> = {
    correct: 0,
    incorrect: 0,
    "in-progress": 0,
    unattempted: problems.length,
  };
  let view = new Date(2026, 10, 1);
  let selected = new Date(2026, 10, 6);

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
    let order: ProblemStatus[] = ["correct", "incorrect", "in-progress", "unattempted"];
    let today = new Date();
    let year = view.getFullYear();
    let month = view.getMonth();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let lead = new Date(year, month, 1).getDay();
    let monthLabel = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    let dueOnSelected = dueDates.find(
      (due) => due.year === selected.getFullYear() && due.month === selected.getMonth() && due.day === selected.getDate(),
    );
    let dueLink = dueOnSelected ? assignmentHref(dueOnSelected.slug) : null;
    let dueIsToday =
      dueOnSelected != null &&
      dueOnSelected.year === today.getFullYear() &&
      dueOnSelected.month === today.getMonth() &&
      dueOnSelected.day === today.getDate();

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
            <div
              aria-label={monthLabel}
              mix={css({
                display: "grid",
                gridTemplateColumns: "repeat(7, 1.75rem)",
                gap: t.space.xs,
                justifyContent: "end",
              })}
            >
              <div
                mix={css({
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: t.space.sm,
                })}
              >
                <button
                  type="button"
                  aria-label="Previous month"
                  mix={[
                    on("click", () => {
                      view = new Date(year, month - 1, 1);
                      handle.update();
                    }),
                    css({
                      border: "none",
                      background: "transparent",
                      color: t.colors.choice.ink,
                      cursor: "pointer",
                      font: "inherit",
                      padding: 0,
                    }),
                  ]}
                >
                  ‹
                </button>
                <span mix={css({ fontSize: t.fontSize.sm, fontWeight: t.fontWeight.semibold })}>{monthLabel}</span>
                <button
                  type="button"
                  aria-label="Next month"
                  mix={[
                    on("click", () => {
                      view = new Date(year, month + 1, 1);
                      handle.update();
                    }),
                    css({
                      border: "none",
                      background: "transparent",
                      color: t.colors.choice.ink,
                      cursor: "pointer",
                      font: "inherit",
                      padding: 0,
                    }),
                  ]}
                >
                  ›
                </button>
              </div>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  mix={css({
                    textAlign: "center",
                    fontSize: t.fontSize.xxxs,
                    color: t.colors.text.muted,
                  })}
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: lead }, (_, index) => (
                <div key={`pad-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                let day = index + 1;
                let due = dueDates.find((item) => item.year === year && item.month === month && item.day === day);
                let isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                let isSelected =
                  selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
                let link = due ? assignmentHref(due.slug) : null;
                let dayStyle = css({
                  textAlign: "center",
                  fontSize: t.fontSize.xs,
                  lineHeight: t.lineHeight.tight,
                  paddingBlock: t.space.xs,
                  border: "none",
                  borderRadius: t.radius.sm,
                  backgroundColor: due ? "#c5d8f0" : "transparent",
                  outline: isToday || isSelected ? `1px solid ${t.colors.choice.ink}` : "none",
                  fontWeight: due || isToday ? t.fontWeight.semibold : t.fontWeight.normal,
                  color: t.colors.text.primary,
                  font: "inherit",
                  cursor: "pointer",
                  textDecoration: "none",
                });
                if (link) {
                  return (
                    <a
                      key={day}
                      href={link.href}
                      data-rmx-src={link.content}
                      data-rmx-target="module"
                      aria-label={`${due!.name} due ${due!.label}`}
                      aria-current={isToday ? "date" : undefined}
                      mix={[
                        on("click", () => {
                          selected = new Date(year, month, day);
                          openAssignment(due!.slug);
                          handle.update();
                        }),
                        dayStyle,
                      ]}
                    >
                      {day}
                    </a>
                  );
                }
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`${monthLabel} ${day}`}
                    aria-current={isToday ? "date" : undefined}
                    aria-pressed={isSelected}
                    mix={[
                      on("click", () => {
                        selected = new Date(year, month, day);
                        handle.update();
                      }),
                      dayStyle,
                    ]}
                  >
                    {day}
                  </button>
                );
              })}
              {dueOnSelected && dueLink ? (
                <a
                  href={dueLink.href}
                  data-rmx-src={dueLink.content}
                  data-rmx-target="module"
                  mix={[
                    on("click", () => {
                      openAssignment(dueOnSelected.slug);
                    }),
                    css({
                      gridColumn: "1 / -1",
                      fontSize: t.fontSize.sm,
                      textAlign: "right",
                      color: t.colors.choice.ink,
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }),
                  ]}
                >
                  {dueOnSelected.name} due {dueIsToday ? "today" : dueOnSelected.label}
                </a>
              ) : null}
            </div>
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
