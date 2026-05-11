import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/dist/**",
            "**/coverage/**",
            "**/node_modules/**",
            ".db/**",
            ".pnpm-store/**",
            ".worktrees/**",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,ts,tsx}"],
        plugins: {
            "@stylistic": stylistic,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            indent: "off",
            "@stylistic/indent": ["error", 4, { SwitchCase: 1 }],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        files: ["apps/frontend/src/**/*.{ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        files: ["apps/backend/**/*.{ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
);
