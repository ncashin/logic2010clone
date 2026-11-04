import { Ban, Braces, GitBranch, ListChecks, Table2, Variable } from "lucide";
import { css } from "pitlane/theme";
import { type Handle, on } from "remix/component";

import type { GuestBookEntry } from "#app/data/schemas.ts";

import { CharacterCounter } from "#app/components/CharacterCounter.tsx";
import { Icon } from "#app/components/Icon.tsx";
import { routes } from "#app/routes.ts";
import { button, field } from "#app/styles/recipes.ts";
import { t } from "#app/theme.ts";

const modules = [
  { name: "Derivation", icon: GitBranch },
  { name: "Invalidity", icon: Ban },
  { name: "Parsing", icon: Braces },
  { name: "Recognizing Rules", icon: ListChecks },
  { name: "Symbolization", icon: Variable },
  { name: "Truth Tables", icon: Table2 },
] as const;

export interface WelcomeProps {
  entries: GuestBookEntry[];
}

export function Welcome(handle: Handle<WelcomeProps>) {
  let selectedModule: (typeof modules)[number]["name"] = modules[0].name;

  return () => {
    let { entries } = handle.props;

    return (
      <div
        mix={[
          css({
            display: "flex",
            flexDirection: "column",

            minHeight: t.size.screen,
            padding: [t.layout.page, t.layout.gutter],
            fontFamily: t.fontFamily.sans,
            color: t.colors.text.primary,
          }),
        ]}
      >
     
        <div
          mix={[
            css({
              display: "flex",
              flexDirection: "row",
              flex: "1",
              minHeight: t.space.none,
              marginTop: t.layout.block,
            }),
          ]}
        >
          <aside
            mix={[
              css({
                display: "flex",
                flexDirection: "column",
                gap: t.space.xs,
                width: t.size.choice,
                flexShrink: "0",
                paddingRight: t.space.lg,
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
              }),
            ]}
          >
            Logic 2010: A Workbook
          </h1>
            {modules.map((module) => (
              <button
                key={module.name}
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
                    width: t.size.full,
                    paddingInline: t.space.md,
                    paddingBlock: t.space.sm,
                    borderRadius: t.radius.md,
                    cursor: "pointer",
                    textAlign: "left",
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
                  mix={css({ width: t.space.xl, height: t.space.xl, flexShrink: "0" })}
                />
                {module.name}
              </button>
            ))}
          </aside>
          <main mix={[css({ flex: "1", paddingLeft: t.layout.gutter })]} />
        </div>
      </div>
    );
  };
}
