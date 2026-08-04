import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Replaces .eslintrc.json, which extended "next/core-web-vitals". Next 16
// removed the `next lint` command and defaults to ESLint flat config; run
// `pnpm lint` (eslint .) instead.
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
