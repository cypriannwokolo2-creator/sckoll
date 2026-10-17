import tseslint from "typescript-eslint";

/**
 * Backend has its own toolchain (the frontend root config ignores `backend/**`).
 * Non-type-aware rules keep lint fast and independent of the build.
 */
export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Tolerate deliberate `catch (unknown)` narrowing patterns used across routes.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
