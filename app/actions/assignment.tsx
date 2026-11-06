import { createController } from "remix/router";

import { Assignment } from "#app/components/Assignment.tsx";
import { Sidebar } from "#app/components/Sidebar.tsx";
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
        async show({ params, render, storage }) {
            let entries = await storage.getMany(GuestBook);
            return render(<Sidebar entries={entries} assignment={params.name} />);
        },
        async content({ params, render }) {
            return render(
                <Assignment name={titles[params.name] ?? params.name} slug={params.name} />,
            );
        },
    },
});