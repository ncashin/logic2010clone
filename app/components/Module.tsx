import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { DerivationProblem } from "#app/components/DerivationProblem.tsx";
import { t } from "#app/theme.ts";

export function Module(_handle: Handle) {
  return () => (
    <main mix={[css({ flex: "1", minHeight: t.size.full })]}>
      <DerivationProblem number="1.0001" problem="~P. Q → P ∴ ~Q" />
    </main>
  );
}
