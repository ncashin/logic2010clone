import { Ban, Braces, GitBranch, ListChecks, Table2, Variable } from "lucide";
import { css } from "pitlane/theme";
import { Frame, type Handle, on } from "remix/component";

import type { GuestBookEntry } from "#app/data/schemas.ts";

import { Icon } from "#app/components/Icon.tsx";
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

function moduleSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}

function moduleHREF(name: string) {
  return routes.module.show.href({ name: moduleSlug(name) });
}

function moduleContentHREF(name: string) {
  return routes.module.content.href({ name: moduleSlug(name) });
}

export interface SidebarProps {
  entries: GuestBookEntry[];
  module?: string;
}

function moduleName(slug: string | undefined) {
  return modules.find((module) => moduleHREF(module.name).endsWith(`/${slug}`))?.name ?? modules[0].name;
}

export function Sidebar(handle: Handle<SidebarProps>) {
    let selectedModule = moduleName(handle.props.module);

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
              padding: t.layout.page,
              borderRightWidth: t.space.px,
              borderRightStyle: "solid",
              borderRightColor: t.colors.border.subtle,
            }),
          ]}
        >
          <h1
            mix={[
              css({
                fontSize: t.fontSize.xl,
                fontWeight: t.fontWeight.bold,
                marginBottom: t.space.xl,
              }),
            ]}
          >
            Logic 2010
          </h1>
          <h2
            mix={[
              css({
                fontSize: t.fontSize.md,
                fontWeight: t.fontWeight.semibold,
                marginBottom: t.space.xl,
              }),
            ]}
          >
            Problem Sets
          </h2>
          {modules.map((module) => (
            <a
              key={module.name}
              href={moduleHREF(module.name)}
              data-rmx-src={moduleContentHREF(module.name)}
              data-rmx-target="module"
              mix={[
                on("click", () => {
                    selectedModule = module.name;
                  handle.update();
                }),
                css({
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.space.sm,
                  paddingInline: t.space.xl,
                  paddingBlock: t.space.sm,
                  borderRadius: t.radius.md,
                  backgroundColor:
                    selectedModule === module.name ? t.surface.lvl2 : undefined,
                  "&:hover": {
                    backgroundColor:
                      selectedModule === module.name
                        ? t.surface.lvl2
                        : t.surface.lvl1,
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
        </aside>
        <main mix={[css({ flex: "1", padding: t.layout.page })]}>
          <Frame name="module" src={moduleContentHREF(selectedModule)} />
        </main>
      </div>
    );
  };
}
