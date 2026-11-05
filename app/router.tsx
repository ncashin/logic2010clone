import { formData } from "remix/middleware/form-data";
import { createRouter, MiddlewareContext } from "remix/router";
import { render } from "remix/spa";

import assignmentPage from "#app/actions/assignment.tsx";
import guestBook from "#app/actions/guest-book.tsx";
import modulePage from "#app/actions/module.tsx";
import welcomePage from "#app/actions/welcome.tsx";
import { NotFound } from "#app/components/NotFound.tsx";
import { loadStorage } from "#app/middleware/storage.ts";
import { routes } from "#app/routes.ts";
import { Theme } from "#app/theme.ts";

type AppContext = MiddlewareContext<
    [ReturnType<typeof render>, ReturnType<typeof formData>, ReturnType<typeof loadStorage>]
>;

declare module "remix/router" {
    interface RouterTypes {
        context: AppContext;
    }
}

export let router = createRouter<AppContext>({
    // render() exposes context.render() for SPA route responses; the transform
    // publishes the app's design tokens alongside every rendered route.
    middleware: [
        render(content => (
            <>
                <Theme />
                {content}
            </>
        )),
        formData(),
        loadStorage(),
    ],
    defaultHandler: ({ render }) => render(<NotFound />, { status: 404 }),
});

router.map(routes.guestBook, guestBook);
router.map(routes.module, modulePage);
router.map(routes.assignment, assignmentPage);
router.map(routes.welcome, welcomePage);
