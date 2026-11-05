import {
  ArrowLeft,
  Ban,
  Braces,
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

function moduleContentHREF(name: string) {
  return routes.module.content.href({ name: moduleSlug(name) });
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
  let showProblems = handle.props.problem != null;

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
                  showProblems = false;
                  handle.update();
                }),
                css({
                  display: "flex",
                  flexShrink: "0",
                  width: showProblems ? t.space.xl : "0px",
                  marginRight: showProblems ? t.space.sm : "0px",
                  opacity: showProblems ? 1 : 0,
                  padding: 0,
                  overflow: "hidden",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  pointerEvents: showProblems ? "auto" : "none",
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
                    opacity: showProblems ? 0 : 1,
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
                    opacity: showProblems ? 1 : 0,
                    transition: "opacity 220ms ease",
                  }),
                ]}
              >
                {selectedModule}
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
                  opacity: showProblems ? 0 : 1,
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
                  opacity: showProblems ? 1 : 0,
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
                  overflow: "auto",
                  opacity: showProblems ? 0 : 1,
                  pointerEvents: showProblems ? "none" : "auto",
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              {modules.map((module) => (
                <a
                  key={module.name}
                  href={moduleHREF(module.name)}
                  data-rmx-src={moduleContentHREF(module.name)}
                  data-rmx-target="module"
                  mix={[
                    on("click", () => {
                      selectedModule = module.name;
                      showProblems = true;
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
                        selectedModule === module.name ? "#c5d8f0" : "transparent",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor:
                          selectedModule === module.name ? "#c5d8f0" : "#e4eef8",
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
              {assignments.map((assignment) => (
                <a
                  key={assignment.name}
                  href={routes.assignment.show.href({ name: assignmentSlug(assignment.name) })}
                  data-rmx-src={routes.assignment.content.href({ name: assignmentSlug(assignment.name) })}
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
            <div
              mix={[
                css({
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  fontFamily: t.fontFamily.mono,
                  fontSize: t.fontSize.sm,
                  lineHeight: t.lineHeight.normal,
                  opacity: showProblems ? 1 : 0,
                  pointerEvents: showProblems ? "auto" : "none",
                  transition: "opacity 220ms ease",
                }),
              ]}
            >
              <ProblemList
                module={moduleSlug(selectedModule)}
                problems={problems}
                selected={handle.props.problem}
              />
            </div>
          </div>
        </aside>
        <main mix={[css({ flex: "1", minWidth: "0" })]}>
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
                  : moduleContentHREF(selectedModule)
            }
          />
        </main>
      </div>
    );
  };
}
