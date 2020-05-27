/**
 * Rollup config to transpile TS files for the jobrunner
 * infrastructure (see `processJobJobrunnerProcessScript.ts`).
 *
 * The exported config still needs `input` and `output` keys.
 */
import { createEnv, readConfigFile } from "@pyoner/svelte-ts-preprocess";

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import pkg from "./packages/server/package.json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

const env = createEnv();
const compilerOptions = readConfigFile(env, "./tsconfig.build.json");
const tsOpts = {
  env,
  compilerOptions: {
    ...compilerOptions,
    allowNonTsExtensions: true,
    verbosity: 3,
  },
  include: ["*.ts+(|x)", "./**/*.ts+(|x)"],
  tsconfig: "./tsconfig.build.json",
};

export default {
  plugins: [
    resolve(),
    typescript(tsOpts),
    commonjs({ exclude: [/^.+\.tsx?$/] }),
    json(),
  ],
  external: Object.keys(pkg.dependencies || {})
    .filter(i => !i.match(/@upswyng/))
    .concat(
      require("module").builtinModules ||
        Object.keys(process.binding("natives"))
    ),
};
