import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { Login } from "#app/components/Login.tsx";
import { signIn } from "#app/data/session.ts";
import { routes } from "#app/routes.ts";

export default createController(routes.login, {
    actions: {
        async index({ render }) {
            return render(<Login />);
        },
        async action({ formData }) {
            let username = formData.get("username");
            let password = formData.get("password");
            signIn(typeof username === "string" && typeof password === "string" ? username : "");
            return redirect(routes.guestBook.index.href());
        },
    },
});
