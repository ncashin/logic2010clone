import { createController } from "remix/router";
import { redirect } from "remix/response/redirect";

import { Assignment } from "#app/components/Assignment.tsx";
import { Module } from "#app/components/Module.tsx";
import { NotFound } from "#app/components/NotFound.tsx";
import { Sidebar } from "#app/components/Sidebar.tsx";
import { assignmentProblemList } from "#app/data/assignments.ts";
import { findProblem } from "#app/data/problems.ts";
import { GuestBook } from "#app/data/schemas.ts";
import { routes } from "#app/routes.ts";

const titles: Record<string, string> = {
    "assignment-1": "Assignment 1",
    "assignment-2": "Assignment 2",
    "assignment-3": "Assignment 3",
    "assignment-4": "Assignment 4",
    "assignment-5": "Assignment 5",
    "assignment-6": "Assignment 6",
};

export default createController(routes.assignment, {
    actions: {
        async index({ render, storage }) {
            let entries = await storage.getMany(GuestBook);
            return render(<Sidebar entries={entries} assignments />);
        },
        async show({ params }) {
            let first = assignmentProblemList(params.name)[0];
            if (!first) return redirect(routes.assignment.index.href());
            return redirect(
                routes.assignment.problem.href({
                    name: params.name,
                    type: first.type,
                    problem: first.number,
                }),
            );
        },
        async content({ params, render }) {
            return render(
                <Assignment name={titles[params.name] ?? params.name} slug={params.name} />,
            );
        },
        async problem({ params, render, storage }) {
            let problem = findProblem(params.type, params.problem);
            if (!problem) return render(<NotFound />, { status: 404 });
            let entries = await storage.getMany(GuestBook);
            return render(
                <Sidebar
                    entries={entries}
                    assignment={params.name}
                    module={params.type}
                    problem={params.problem}
                />,
            );
        },
        async problemContent({ params, render }) {
            let problem = findProblem(params.type, params.problem);
            if (!problem) return render(<NotFound />, { status: 404 });
            return render(<Module problem={problem} />);
        },
    },
});