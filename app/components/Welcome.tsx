import { css } from "pitlane/theme";

import { t } from "#app/theme.ts";

export const sectionPadding = {
  paddingInline: t.space.xl,
  paddingTop: t.space.xxl,
  paddingBottom: t.space.xl,
} as const;

export function Welcome() {
  return () => (
    <main
      mix={[
        css({
          ...sectionPadding,
          minHeight: t.size.full,
          fontFamily: t.fontFamily.sans,
          fontSize: t.fontSize.md,
          lineHeight: t.lineHeight.relaxed,
          color: t.colors.text.primary,
        }),
      ]}
    >
      <p mix={css({ margin: 0 })}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      </p>
    </main>
  );
}
