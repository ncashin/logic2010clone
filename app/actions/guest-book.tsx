import * as s from "remix/data-schema";
import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { Sidebar } from "#app/components/Sidebar.tsx";
import { CreateGuestBookEntry, GuestBook } from "#app/data/schemas.ts";
import { routes } from "#app/routes.ts";

export default createController(routes.guestBook, {
    actions: {
        async index({ render, storage }) {
            let entries = await storage.getMany(GuestBook);
            return render(<Sidebar entries={entries} />);
        },
        async action({ storage, formData }) {
            let payload = s.parse(CreateGuestBookEntry, formData);
            await storage.set(GuestBook, payload);
            return redirect(routes.guestBook.index.href());
        },
    },
});
