import { createTheme } from "pitlane/theme";
import * as s from "pitlane/theme/schema";

/**
 * App-owned design tokens, installed on the document as CSS custom properties
 * by `<Theme />`.
 *
 * The schema names each group's token type, and the token values are the CSS
 * they become. The base values are the light palette. `<Theme />` emits a
 * `:root` block, so the page stays black text on white regardless of the OS
 * appearance setting.
 *
 * Tokens that reference other tokens are declared in the `extend` layer, where
 * the base accessor is in scope. Each one stays a `var()` reference, so a dark
 * override of the token it names flows through the cascade.
 *
 * Reference tokens in `css()` mixins through the exported `t`, e.g.
 * `css({ gap: t.space.md })`.
 */
export let { token: t, Theme } = createTheme({
    schema: {
        fontFamily: s.font.family(),
        space: s.dimension(),
        layout: s.dimension(),
        size: s.dimension(),
        radius: s.dimension(),
        fontSize: s.dimension(),
        lineHeight: s.number(),
        letterSpacing: s.dimension(),
        fontWeight: s.font.weight(),
        control: s.dimension(),
        shadow: s.shadow(),
        surface: s.color(),
        colors: s.color(),
    },
    tokens: {
        fontFamily: {
            sans: [
                "Inter var",
                "ui-sans-serif",
                "system-ui",
                "sans-serif",
                "Apple Color Emoji",
                "Segoe UI Emoji",
                "Segoe UI Symbol",
                "Noto Color Emoji",
            ],
            mono: [
                "ui-monospace",
                "SFMono-Regular",
                "Menlo",
                "Monaco",
                "Consolas",
                "Liberation Mono",
                "Courier New",
                "monospace",
            ],
        },
        space: {
            none: "0px",
            px: "1px",
            xs: "2px",
            sm: "4px",
            md: "8px",
            lg: "12px",
            xl: "16px",
            xxl: "24px",
        },
        layout: {
            section: "32px",
            block: "48px",
            page: "0.75rem",
        },
        size: {
            logo: "40px",
            column: "448px",
            prose: "512px",
            full: "100%",
            screen: "100vh",
            choice: "260px",
        },
        radius: {
            none: "0px",
            sm: "4px",
            md: "6px",
            lg: "8px",
            xl: "12px",
            full: "9999px",
        },
        fontSize: {
            xxxs: "10px",
            xxs: "11px",
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "18px",
            xl: "20px",
            xxl: "28px",
            xxxl: "36px",
        },
        lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
        letterSpacing: {
            tight: "-0.025em",
            normal: "0",
            meta: "0.025em",
            wide: "0.05em",
        },
        fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
        control: { height: { sm: "28px", md: "36px", lg: "44px" } },
        shadow: {
            xs: "0px 1px 2px rgb(0 0 0 / 0.05)",
            sm: "0px 1px 3px rgb(0 0 0 / 0.10)",
            md: "0px 4px 10px rgb(0 0 0 / 0.12)",
            lg: "0px 10px 30px rgb(0 0 0 / 0.16)",
            xl: "0px 20px 50px rgb(0 0 0 / 0.20)",
        },
        surface: {
            lvl0: "#ffffff",
            lvl1: "#f9fafb",
            lvl2: "#f3f4f6",
            lvl3: "#e5e7eb",
            lvl4: "#d1d5db",
        },
        colors: {
            text: {
                primary: "#111827",
                secondary: "#374151",
                muted: "#6b7280",
                warning: "#ef4444",
                link: "#2563eb",
                linkHover: "#1e40af",
            },
            highlight: { inset: "rgb(255 255 255 / 0.7)" },
            border: {
                subtle: "#e5e7eb",
                default: "#d1d5db",
                strong: "#9ca3af",
            },
            focus: { ring: "#3b82f6" },
            overlay: { scrim: "rgb(0 0 0 / 0.45)" },
            /**
             * Module chooser. Fixed classic chrome: blue ink, gray canvas,
             * raised faces. It does not follow the light/dark page palette.
             */
            choice: {
                canvas: "#d0d0d0",
                ink: "#0000cc",
                face: "#e8e8e8",
                faceHover: "#f4f4f4",
                faceActive: "#dcdcdc",
                edge: "#b0b0b0",
                rule: "#0000cc",
            },
            action: {
                primary: {
                    background: "#2563eb",
                    backgroundHover: "#1d4ed8",
                    backgroundActive: "#1e40af",
                    foreground: "#ffffff",
                    border: "#2563eb",
                },
                secondary: {
                    background: "#ffffff",
                    backgroundHover: "#f9fafb",
                    backgroundActive: "#f3f4f6",
                    foreground: "#111827",
                    border: "#d1d5db",
                },
                danger: {
                    background: "#dc2626",
                    backgroundHover: "#b91c1c",
                    backgroundActive: "#991b1b",
                    foreground: "#ffffff",
                    border: "#dc2626",
                },
            },
        },
    },
}).extend(base => ({
    tokens: {
        layout: { gutter: base.space.xl },
        shadow: { inset: `inset 0px 1px 0px ${base.colors.highlight.inset}` },
    },
}));
