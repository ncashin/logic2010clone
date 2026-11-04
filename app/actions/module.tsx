import { createController } from "remix/router";

import { Module } from "#app/components/Module.tsx";
import { Sidebar } from "#app/components/Sidebar.tsx";
import { routes } from "#app/routes.ts";
import { GuestBook } from "#app/data/schemas.ts";

export default createController(routes.module, {
    actions: {
        async show({ params, render, storage }) {
            let entries = await storage.getMany(GuestBook);
            return render(<Sidebar entries={entries} module={params.name} />);
        },
        async content({ render }) {
            return render(<Module />);
        },
    },
});
