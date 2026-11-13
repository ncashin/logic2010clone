import { type Middleware } from "remix/router";
import { redirect } from "remix/response/redirect";

import { signedIn } from "#app/data/session.ts";
import { routes } from "#app/routes.ts";

/** Send unsigned visitors to the login page. The login route itself stays open. */
export function requireLogin(): Middleware {
    return (context, next) => {
        let loginPath = new URL(routes.login.index.href(), context.url).pathname;
        if (context.url.pathname === loginPath) return next();
        if (signedIn()) return next();
        return redirect(routes.login.index.href());
    };
}
