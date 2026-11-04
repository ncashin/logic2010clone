import { css } from "pitlane/theme";
import { type Handle } from "remix/component";

import type { GuestBookEntry } from "#app/data/schemas.ts";

import { CharacterCounter } from "#app/components/CharacterCounter.tsx";
import { routes } from "#app/routes.ts";
import { button, field } from "#app/styles/recipes.ts";
import { t } from "#app/theme.ts";

const moduleNames = [
  "Derivation",
  "Invalidity",
  "Parsing",
  "Recognizing Rules",
  "Symbolization",
  "Truth Tables",
] as const;

export interface WelcomeProps {
  entries: GuestBookEntry[];
}

export function Welcome(handle: Handle<WelcomeProps>) {
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
        <header
          mix={[
            css({
              display: "flex",
              flexDirection: "row",
              maxWidth: t.size.prose,
            }),
          ]}
        >
          <h1
            mix={[
              css({
                fontSize: t.fontSize.xxxl,
                fontWeight: t.fontWeight.bold,
              }),
            ]}
          >
            Logic 2010: A Workbook
          </h1>
        </header>

        <section
          mix={[
            css({
              display: "flex",
              flexDirection: "row",
              width: t.size.full,
              marginTop: t.layout.block,
            }),
          ]}
        >
          {moduleNames.map((moduleName) => (
            <div key={moduleName}>
              <button
                mix={[
                  css({
                    paddingInline: t.space.xl,
                    paddingBlock: t.space.sm,
                    borderRadius: t.radius.md,
                    "&:hover": {
                      backgroundColor: t.surface.lvl1,
                    },
                  }),
                ]}
              >
                {moduleName}
              </button>
            </div>
          ))}
        </section>
      </div>
    );
  };
}
