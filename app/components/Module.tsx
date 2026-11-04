import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { DerivationProblem } from "#app/components/DerivationProblem.tsx";
import type { Problem } from "#app/components/ProblemList.tsx";
import { t } from "#app/theme.ts";

export interface ModuleProps {
  problem: Problem;
}

export function Module(handle: Handle<ModuleProps>) {
  return () => (
    <main mix={[css({ flex: "1", minHeight: t.size.full })]}>
      <DerivationProblem problem={handle.props.problem} />
    </main>
  );
}
