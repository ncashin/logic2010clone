import {
  ArrowLeft,
  Ban,
  Braces,
  CircleHelp,
  Clipboard,
  ExternalLink,
  FileText,
  GitBranch,
  Library,
  ListChecks,
  Notebook,
  NotebookPen,
  ScrollText,
  Table2,
  Variable,
} from "lucide";
import { css } from "pitlane/theme";
import { Frame, type Handle, on } from "remix/component";

import type { GuestBookEntry } from "#app/data/schemas.ts";

import { Icon } from "#app/components/Icon.tsx";
import { ProblemList } from "#app/components/ProblemList.tsx";
import { assignmentProblemList } from "#app/data/assignments.ts";
import { problemId, problemsForType } from "#app/data/problems.ts";
import { routes } from "#app/routes.ts";
import { t } from "#app/theme.ts";

const modules = [
  { name: "Derivation", icon: GitBranch },
  { name: "Invalidity", icon: Ban },
  { name: "Parsing", icon: Braces },
  { name: "Recognizing Rules", icon: ListChecks },
  { name: "Symbolization", icon: Variable },
  { name: "Truth Tables", icon: Table2 },
] as const;

const assignments = [
  { name: "Assignment 1", icon: Clipboard, due: "Due Monday October 26th 2026" },
  { name: "Assignment 2", icon: Notebook, due: "Due Tuesday October 27th 2026" },
  { name: "Assignment 3", icon: NotebookPen, due: "Due Wednesday October 28th 2026" },
  { name: "Assignment 4", icon: FileText, due: "Due Thursday October 29th 2026" },
  { name: "Assignment 5", icon: ScrollText, due: "Due Friday October 30th 2026" },
  { name: "Assignment 6", icon: Library, due: "Due Friday November 6th 2026" },
] as const;

function moduleSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}

function moduleHREF(name: string) {
  return routes.module.show.href({ name: moduleSlug(name) });
}

function assignmentSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}

function assignmentName(slug: string | undefined) {
  return assignments.find((assignment) => assignmentSlug(assignment.name) === slug)?.name ?? "Assignment";
}

function firstProblem(type: string) {
  return problemsForType(type)[0];
}

export interface SidebarProps {
  entries: GuestBookEntry[];
  module?: string;
  problem?: string;
  assignment?: string;
  assignments?: boolean;
}

function moduleName(slug: string | undefined) {
  return modules.find((module) => moduleHREF(module.name).endsWith(`/${slug}`))?.name ?? modules[0].name;
}

export function Sidebar(handle: Handle<SidebarProps>) {
  let selectedModule = moduleName(handle.props.module);
  let panel: "menu" | "problems" | "assignment" = handle.props.assignment
    ? "assignment"
    : handle.props.module
      ? "problems"
      : "menu";
  let selectedAssignment = handle.props.assignment;
  let selectedAssignmentItem = (() => {
    if (handle.props.assignment && handle.props.module && handle.props.problem) {
      return problemId(handle.props.module, handle.props.problem);
    }
    let first = assignmentProblemList(handle.props.assignment)[0];
    return first ? problemId(first.type, first.number) : "";
  })();
  let selectedProblem = handle.props.problem
    ? problemId(moduleSlug(selectedModule), handle.props.problem)
    : (() => {
        let first = firstProblem(moduleSlug(selectedModule));
        return first ? problemId(first.type, first.number) : "";
      })();
  let selectionNonce = 0;

  return () => {

    return (
      <div
        mix={[
          css({
            display: "flex",
            flexDirection: "row",
            minHeight: t.size.screen,
            fontFamily: t.fontFamily.sans,
            color: t.colors.text.primary,
          }),
        ]}
      >
        <aside
          mix={[
            css({
              display: "flex",
              flexDirection: "column",
              width: t.size.column,
              flexShrink: "0",
              overflow: "hidden",
              borderRightWidth: t.space.px,
              borderRightStyle: "solid",
              borderRightColor: t.colors.border.subtle,
              backgroundColor: t.colors.choice.faceHover,
            }),
          ]}
        >
          <div
            mix={[
              css({
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                paddingInline: t.space.md,
                paddingTop: t.space.xl,
                paddingBottom: t.space.lg,
              }),
            ]}
          >
            <a
              href={routes.guestBook.index.href()}
              data-rmx-src={routes.welcome.show.href()}
              data-rmx-target="module"
              aria-label="Back"
              mix={[
                on("click", () => {
                  panel = "menu";
                  handle.update();
                }),
                css({
                  display: "flex",
                  flexShrink: "0",
                  width: panel !== "menu" ? t.space.xl : "0px",
                  marginRight: panel !== "menu" ? t.space.sm : "0px",
                  opacity: panel !== "menu" ? 1 : 0,
                  padding: 0,
                  overflow: "hidden",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  pointerEvents: panel !== "menu" ? "auto" : "none",
                  transition: "width 220ms ease, margin-right 220ms ease, opacity 220ms ease",
                }),
              ]}
            >
              <Icon
                icon={ArrowLeft}
                mix={css({
                  width: t.space.xl,
                  height: t.space.xl,
                  strokeWidth: 2.5,
                })}
              />
            </a>
            <div mix={[css({ display: "grid", flex: "1" })]}>
              <h1
                mix={[
                  css({
                    gridArea: "1 / 1",
                    margin: 0,
                    fontSize: t.fontSize.xl,
                    fontWeight: t.fontWeight.bold,
                    opacity: panel === "menu" ? 1 : 0,
                    transition: "opacity 220ms ease",
                  }),
                ]}
              >
                Logic 2010
              </h1>
              <h1
                mix={[
                  css({
                    gridArea: "1 / 1",
                    margin: 0,
                    fontSize: t.fontSize.xl,
                    fontWeight: t.fontWeight.bold,
                    opacity: panel === "problems" ? 1 : 0,
                    transition: "opacity 220ms ease",
                  }),
                ]}
              >
                {selectedModule}
              </h1>
              <h1
                mix={[
                  css({
                    gridArea: "1 / 1",
                    margin: 0,
                    fontSize: t.fontSize.xl,
                    fontWeight: t.fontWeight.bold,
                    opacity: panel === "assignment" ? 1 : 0,
                    transition: "opacity 220ms ease",
                  }),
                ]}
              >
                {assignmentName(selectedAssignment)}
              </h1>
            </div>
          </div>
          <div mix={[css({ display: "grid" })]}>
            <h2
              mix={[
                css({
                  gridArea: "1 / 1",
                  margin: 0,
                  paddingInline: t.space.md,
                  paddingBlock: t.space.xs,
                  fontSize: t.fontSize.sm,
                  fontWeight: t.fontWeight.semibold,
                  opacity: panel === "menu" ? 1 : 0,
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              Problem Sets
            </h2>
            <h2
              mix={[
                css({
                  gridArea: "1 / 1",
                  margin: 0,
                  paddingInline: t.space.md,
                  paddingBlock: t.space.xs,
                  fontSize: t.fontSize.sm,
                  fontWeight: t.fontWeight.semibold,
                  opacity: panel === "problems" ? 1 : 0,
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              Problems
            </h2>
            <h2
              mix={[
                css({
                  gridArea: "1 / 1",
                  margin: 0,
                  paddingInline: t.space.md,
                  paddingBlock: t.space.xs,
                  fontSize: t.fontSize.sm,
                  fontWeight: t.fontWeight.semibold,
                  opacity: panel === "assignment" ? 1 : 0,
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              Problems
            </h2>
          </div>
          <div mix={[css({ position: "relative", flex: "1", minHeight: "0" })]}>
            <div
              mix={[
                css({
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  opacity: panel === "menu" ? 1 : 0,
                  pointerEvents: panel === "menu" ? "auto" : "none",
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              <div mix={css({ display: "flex", flexDirection: "column", flex: "1", minHeight: "0", overflow: "auto" })}>
              {modules.map((module) => {
                let slug = moduleSlug(module.name);
                let first = firstProblem(slug);
                return (
                <a
                  key={module.name}
                  href={
                    first
                      ? routes.module.problem.href({
                          name: slug,
                          problem: first.number,
                        })
                      : moduleHREF(module.name)
                  }
                  data-rmx-src={
                    first
                      ? routes.module.problemContent.href({
                          name: slug,
                          problem: first.number,
                        })
                      : routes.welcome.show.href()
                  }
                  data-rmx-target="module"
                  mix={[
                    on("click", () => {
                      selectedModule = module.name;
                      panel = "problems";
                      if (first) {
                        selectedProblem = problemId(first.type, first.number);
                        selectionNonce += 1;
                      }
                      handle.update();
                    }),
                    css({
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: t.space.sm,
                      width: t.size.full,
                      paddingInline: t.space.md,
                      paddingBlock: t.space.xs,
                      color: t.colors.choice.ink,
                      backgroundColor:
                        handle.props.module &&
                        !handle.props.assignment &&
                        selectedModule === module.name
                          ? "#c5d8f0"
                          : "transparent",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor:
                          handle.props.module &&
                          !handle.props.assignment &&
                          selectedModule === module.name
                            ? "#c5d8f0"
                            : "#e4eef8",
                      },
                    }),
                  ]}
                >
                  <Icon
                    icon={module.icon}
                    mix={css({ width: t.space.xl, height: t.space.xl })}
                  />
                  {module.name}
                </a>
                );
              })}
              <h2
                mix={[
                  css({
                    margin: 0,
                    marginTop: t.space.lg,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.xs,
                    fontSize: t.fontSize.sm,
                    fontWeight: t.fontWeight.semibold,
                  }),
                ]}
              >
                Assignments
              </h2>
              {assignments.map((assignment) => {
                let slug = assignmentSlug(assignment.name);
                let first = assignmentProblemList(slug)[0];
                return (
                  <a
                    key={assignment.name}
                    href={
                      first
                        ? routes.assignment.problem.href({
                            name: slug,
                            type: first.type,
                            problem: first.number,
                          })
                        : routes.assignment.show.href({ name: slug })
                    }
                    data-rmx-src={
                      first
                        ? routes.assignment.problemContent.href({
                            name: slug,
                            type: first.type,
                            problem: first.number,
                          })
                        : routes.welcome.show.href()
                    }
                    data-rmx-target="module"
                    mix={[
                      on("click", () => {
                        selectedAssignment = slug;
                        selectedAssignmentItem = first ? problemId(first.type, first.number) : "";
                        selectionNonce += 1;
                        panel = "assignment";
                        handle.update();
                      }),
                      css({
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: t.space.sm,
                        width: t.size.full,
                        paddingInline: t.space.md,
                        paddingBlock: t.space.xs,
                        color: t.colors.choice.ink,
                        backgroundColor: selectedAssignment === slug ? "#c5d8f0" : "transparent",
                        cursor: "pointer",
                        textDecoration: "none",
                        "&:hover": {
                          backgroundColor: selectedAssignment === slug ? "#c5d8f0" : "#e4eef8",
                        },
                      }),
                    ]}
                  >
                    <Icon
                      icon={assignment.icon}
                      mix={css({ width: t.space.xl, height: t.space.xl, flexShrink: "0" })}
                    />
                    <span mix={css({ minWidth: "0" })}>{assignment.name}</span>
                    <span
                      mix={css({
                        marginLeft: "auto",
                        flexShrink: "0",
                        fontSize: t.fontSize.sm,
                        color: t.colors.text.muted,
                      })}
                    >
                      {assignment.due}
                    </span>
                  </a>
                );
              })}
              <h2
                mix={[
                  css({
                    margin: 0,
                    marginTop: t.space.lg,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.xs,
                    fontSize: t.fontSize.sm,
                    fontWeight: t.fontWeight.semibold,
                  }),
                ]}
              >
                Resources
              </h2>
              <button
                type="button"
                mix={[
                  css({
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: t.space.sm,
                    width: t.size.full,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.xs,
                    border: "none",
                    font: "inherit",
                    textAlign: "left",
                    color: t.colors.choice.ink,
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#e4eef8" },
                  }),
                ]}
              >
                <Icon icon={CircleHelp} mix={css({ width: t.space.xl, height: t.space.xl })} />
                Help
              </button>
              <a
                href="https://online.mun.ca/d2l/home/677996"
                target="_blank"
                rel="noreferrer"
                mix={[
                  css({
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: t.space.sm,
                    width: t.size.full,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.xs,
                    color: t.colors.choice.ink,
                    backgroundColor: "transparent",
                    textDecoration: "none",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#e4eef8" },
                  }),
                ]}
              >
                <Icon icon={ExternalLink} mix={css({ width: t.space.xl, height: t.space.xl })} />
                Course Website
              </a>
            </div>
            </div>
            <div
              mix={[
                css({
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  opacity: panel === "problems" ? 1 : 0,
                  pointerEvents: panel === "problems" ? "auto" : "none",
                  transition: "opacity 220ms ease",
                  fontFamily: t.fontFamily.mono,
                  fontSize: t.fontSize.sm,
                  lineHeight: t.lineHeight.normal,
                }),
              ]}
            >
              <ProblemList
                problems={problemsForType(moduleSlug(selectedModule))}
                selected={selectedProblem}
                selectionNonce={selectionNonce}
                label="statement"
              />
            </div>
            <div
              mix={[
                css({
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  opacity: panel === "assignment" ? 1 : 0,
                  pointerEvents: panel === "assignment" ? "auto" : "none",
                  transition: "opacity 220ms ease",
                  fontFamily: t.fontFamily.mono,
                  fontSize: t.fontSize.sm,
                  lineHeight: t.lineHeight.normal,
                }),
              ]}
            >
              <ProblemList
                problems={assignmentProblemList(selectedAssignment)}
                selected={selectedAssignmentItem}
                selectionNonce={selectionNonce}
                label="typed"
                href={(problem) =>
                  routes.assignment.problem.href({
                    name: selectedAssignment ?? "",
                    type: problem.type,
                    problem: problem.number,
                  })
                }
                content={(problem) =>
                  routes.assignment.problemContent.href({
                    name: selectedAssignment ?? "",
                    type: problem.type,
                    problem: problem.number,
                  })
                }
              />
            </div>
          </div>
        </aside>
        <main mix={[css({ flex: "1", minWidth: "0", minHeight: t.size.screen })]}>
          <Frame
            name="module"
            src={(() => {
              if (handle.props.assignment && handle.props.module && handle.props.problem) {
                return routes.assignment.problemContent.href({
                  name: handle.props.assignment,
                  type: handle.props.module,
                  problem: handle.props.problem,
                });
              }
              let first = assignmentProblemList(handle.props.assignment)[0];
              if (first && handle.props.assignment) {
                return routes.assignment.problemContent.href({
                  name: handle.props.assignment,
                  type: first.type,
                  problem: first.number,
                });
              }
              if (handle.props.problem) {
                return routes.module.problemContent.href({
                  name: moduleSlug(selectedModule),
                  problem: handle.props.problem,
                });
              }
              return routes.welcome.show.href();
            })()}
          />
        </main>
      </div>
    );
  };
}
