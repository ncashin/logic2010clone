import { createController } from "remix/router";

import { Welcome } from "#app/components/Welcome.tsx";
import { routes } from "#app/routes.ts";

export default createController(routes.welcome, {
    actions: {
        async show({ render }) {
            return render(<Welcome />);
        },
    },
});
