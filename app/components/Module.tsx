import { css } from "pitlane/theme";
import type { Handle } from "remix/component";

import { DerivationProblem } from "#app/components/DerivationProblem.tsx";
import { ProblemWorkspace } from "#app/components/ProblemWorkspace.tsx";
import type { Problem } from "#app/data/problems.ts";
import { t } from "#app/theme.ts";

export interface ModuleProps {
  problem: Problem;
}

export function Module(handle: Handle<ModuleProps>) {
  return () => (
    <main mix={[css({ flex: "1", minHeight: t.size.full })]}>
      {handle.props.problem.type === "derivation" ? (
        <DerivationProblem problem={handle.props.problem} />
      ) : (
        <ProblemWorkspace problem={handle.props.problem} />
      )}
    </main>
  );
}
