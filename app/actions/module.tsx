import { createController } from "remix/router";
import { redirect } from "remix/response/redirect";

import { Module } from "#app/components/Module.tsx";
import { NotFound } from "#app/components/NotFound.tsx";
import { Sidebar } from "#app/components/Sidebar.tsx";
import { findProblem, problemsForType } from "#app/data/problems.ts";
import { GuestBook } from "#app/data/schemas.ts";
import { routes } from "#app/routes.ts";

export default createController(routes.module, {
    actions: {
        async show({ params, render, storage }) {
            let first = problemsForType(params.name)[0];
            if (first) {
                return redirect(routes.module.problem.href({ name: params.name, problem: first.number }));
            }
            let entries = await storage.getMany(GuestBook);
            return render(<Sidebar entries={entries} module={params.name} />);
        },
        async content({ params, render }) {
            let first = problemsForType(params.name)[0];
            if (!first) return render(<NotFound />, { status: 404 });
            return render(<Module problem={first} />);
        },
        async problem({ params, render, storage }) {
            let entries = await storage.getMany(GuestBook);
            return render(
                <Sidebar entries={entries} module={params.name} problem={params.problem} />,
            );
        },
        async problemContent({ params, render }) {
            let problem = findProblem(params.name, params.problem);
            if (!problem) return render(<NotFound />, { status: 404 });
            return render(<Module problem={problem} />);
        },
    },
});
