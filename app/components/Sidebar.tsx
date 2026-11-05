import {
  ArrowLeft,
  Ban,
  Braces,
  CircleHelp,
  Clipboard,
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
import { problems } from "#app/data/problems.ts";
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
  { name: "Assignment 1", icon: Clipboard },
  { name: "Assignment 2", icon: Notebook },
  { name: "Assignment 3", icon: NotebookPen },
  { name: "Assignment 4", icon: FileText },
  { name: "Assignment 5", icon: ScrollText },
  { name: "Assignment 6", icon: Library },
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

export interface SidebarProps {
  entries: GuestBookEntry[];
  module?: string;
  problem?: string;
  assignment?: string;
}

function moduleName(slug: string | undefined) {
  return modules.find((module) => moduleHREF(module.name).endsWith(`/${slug}`))?.name ?? modules[0].name;
}

export function Sidebar(handle: Handle<SidebarProps>) {
  let selectedModule = moduleName(handle.props.module);
  let panel: "menu" | "problems" | "assignments" = handle.props.assignment
    ? "assignments"
    : handle.props.problem != null
      ? "problems"
      : "menu";
  let detail: "problems" | "assignments" = panel === "assignments" ? "assignments" : "problems";

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
            <button
              type="button"
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
            </button>
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
                    opacity: panel === "assignments" ? 1 : 0,
                    transition: "opacity 220ms ease",
                  }),
                ]}
              >
                Assignments
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
                  opacity: panel === "assignments" ? 1 : 0,
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              Assignments
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
                  overflow: "auto",
                  opacity: panel === "menu" ? 1 : 0,
                  pointerEvents: panel === "menu" ? "auto" : "none",
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              {modules.map((module) => (
                <a
                  key={module.name}
                  href={moduleHREF(module.name)}
                  data-rmx-src={routes.welcome.show.href()}
                  data-rmx-target="module"
                  mix={[
                    on("click", () => {
                      selectedModule = module.name;
                      panel = "problems";
                      detail = "problems";
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
                        !handle.props.assignment && selectedModule === module.name
                          ? "#c5d8f0"
                          : "transparent",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor:
                          !handle.props.assignment && selectedModule === module.name
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
              ))}
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
              <button
                type="button"
                mix={[
                  on("click", () => {
                    panel = "assignments";
                    detail = "assignments";
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
                    border: "none",
                    font: "inherit",
                    textAlign: "left",
                    color: t.colors.choice.ink,
                    backgroundColor: handle.props.assignment ? "#c5d8f0" : "transparent",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: handle.props.assignment ? "#c5d8f0" : "#e4eef8",
                    },
                  }),
                ]}
              >
                <Icon icon={Clipboard} mix={css({ width: t.space.xl, height: t.space.xl })} />
                Assignments
              </button>
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
            </div>
            <div
              mix={[
                css({
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  opacity: panel === "menu" ? 0 : 1,
                  pointerEvents: panel === "menu" ? "none" : "auto",
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              {detail === "problems" ? (
                <div
                  mix={[
                    css({
                      display: "flex",
                      flexDirection: "column",
                      height: t.size.full,
                      minHeight: "0",
                      overflow: "hidden",
                      fontFamily: t.fontFamily.mono,
                      fontSize: t.fontSize.sm,
                      lineHeight: t.lineHeight.normal,
                    }),
                  ]}
                >
                  <ProblemList
                    module={moduleSlug(selectedModule)}
                    problems={problems}
                    selected={handle.props.problem}
                  />
                </div>
              ) : (
                <div
                  mix={[
                    css({
                      display: "flex",
                      flexDirection: "column",
                      overflow: "auto",
                    }),
                  ]}
                >
                  {assignments.map((assignment) => (
                    <a
                      key={assignment.name}
                      href={routes.assignment.show.href({ name: assignmentSlug(assignment.name) })}
                      data-rmx-src={routes.assignment.content.href({
                        name: assignmentSlug(assignment.name),
                      })}
                      data-rmx-target="module"
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
                          backgroundColor:
                            handle.props.assignment === assignmentSlug(assignment.name)
                              ? "#c5d8f0"
                              : "transparent",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor:
                              handle.props.assignment === assignmentSlug(assignment.name)
                                ? "#c5d8f0"
                                : "#e4eef8",
                          },
                        }),
                      ]}
                    >
                      <Icon
                        icon={assignment.icon}
                        mix={css({ width: t.space.xl, height: t.space.xl })}
                      />
                      {assignment.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
        <main mix={[css({ flex: "1", minWidth: "0", minHeight: t.size.screen })]}>
          <Frame
            name="module"
            src={
              handle.props.assignment
                ? routes.assignment.content.href({ name: handle.props.assignment })
                : handle.props.problem
                  ? routes.module.problemContent.href({
                      name: moduleSlug(selectedModule),
                      problem: handle.props.problem,
                    })
                  : routes.welcome.show.href()
            }
          />
        </main>
      </div>
    );
  };
}
