import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { t } from "#app/theme.ts";

export function Module(_handle: Handle) {
  return () => <main mix={[css({ flex: "1", minHeight: t.size.full })]} />;
}
