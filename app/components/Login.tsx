import { css } from "pitlane/theme";

import { routes } from "#app/routes.ts";
import { button, field } from "#app/styles/recipes.ts";
import { t } from "#app/theme.ts";

export function Login() {
    return () => (
        <main
            mix={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: t.size.screen,
                padding: t.layout.gutter,
                fontFamily: t.fontFamily.sans,
                color: t.colors.text.primary,
                backgroundColor: t.surface.lvl1,
            })}
        >
            <form
                action={routes.login.action.href()}
                method="post"
                mix={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: t.space.lg,
                    width: "100%",
                    maxWidth: "24rem",
                    padding: t.space.xxl,
                    border: `1px solid ${t.colors.border.default}`,
                    borderRadius: t.radius.lg,
                    backgroundColor: t.surface.lvl0,
                    boxShadow: t.shadow.md,
                })}
            >
                <div mix={css({ display: "flex", flexDirection: "column", gap: t.space.xs })}>
                    <img
                        alt=""
                        src={`${import.meta.env.BASE_URL}logic2010.png`}
                        mix={css({
                            width: "64px",
                            height: "64px",
                            alignSelf: "center",
                            marginBottom: t.space.lg,
                            borderRadius: t.radius.lg,
                        })}
                    />
                    <h1
                        mix={css({
                            margin: 0,
                            fontSize: t.fontSize.xl,
                            fontWeight: t.fontWeight.semibold,
                            lineHeight: t.lineHeight.tight,
                        })}
                    >
                        Logic 2010
                    </h1>
                </div>
                <label mix={css({ display: "flex", flexDirection: "column", gap: t.space.xs })}>
                    <span mix={css({ fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium })}>
                        Username
                    </span>
                    <input autocomplete="username" mix={field()} name="username" type="text" />
                </label>
                <label mix={css({ display: "flex", flexDirection: "column", gap: t.space.xs })}>
                    <span mix={css({ fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium })}>
                        Password
                    </span>
                    <input
                        autocomplete="current-password"
                        mix={field()}
                        name="password"
                        type="password"
                    />
                </label>
                <button mix={button({ tone: "primary" })} type="submit">
                    Sign in
                </button>
            </form>
        </main>
    );
}
