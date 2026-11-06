import { route, form, get } from "remix/routes";

// Routes live under Vite's base (vite.config.ts) so the app also works on
// GitHub project pages, where it is served from /<repo>/ instead of /.
export let routes = route({
    guestBook: form(import.meta.env.BASE_URL),
    module: route({
        show: get(`${import.meta.env.BASE_URL}modules/:name`),
        content: get(`${import.meta.env.BASE_URL}modules/:name/content`),
        problem: get(`${import.meta.env.BASE_URL}modules/:name/:problem`),
        problemContent: get(`${import.meta.env.BASE_URL}modules/:name/:problem/content`),
    }),
    assignment: route({
        index: get(`${import.meta.env.BASE_URL}assignments`),
        show: get(`${import.meta.env.BASE_URL}assignments/:name`),
        content: get(`${import.meta.env.BASE_URL}assignments/:name/content`),
    }),
    welcome: route({
        show: get(`${import.meta.env.BASE_URL}welcome`),
    }),
});
