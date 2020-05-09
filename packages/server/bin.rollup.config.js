import { createEnv, readConfigFile } from "@pyoner/svelte-ts-preprocess";

import commonjs from "@rollup/plugin-commonjs";
import fs from "fs";
import json from "@rollup/plugin-json";
import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import shebang from "rollup-plugin-add-shebang";
import typescript from "rollup-plugin-typescript2";

function camelToSnake(string) {
  return string
    .replace(/[\w]([A-Z])/g, function(m) {
      return m[0] + "_" + m[1];
    })
    .toLowerCase();
}

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

const targets = process.env.TARGETS
  ? process.env.TARGETS.split(",")
  : fs
      .readdirSync("./src/bin")
      .filter(x => /^.+\.ts/.test(x))
      .map(f => {
        // remove extension
        return f.slice(0, -3);
      });

// IDEA(@rhinodavid): suppress the output from rollup and just print out the file name as they succeed

export default targets.map(target => ({
  input: `./src/bin/${target}.ts`,
  output: { file: `__build__/bin/${camelToSnake(target)}`, format: "cjs" },
  plugins: [
    resolve(),
    typescript(tsOpts),
    commonjs({ exclude: [/^.+\.tsx?$/] }),
    json(),
    shebang({
      include: `**/${camelToSnake(target)}`,
    }),
  ],
  external: Object.keys(pkg.dependencies || {})
    .filter(i => !i.match(/@upswyng/))
    .concat(
      require("module").builtinModules ||
        Object.keys(process.binding("natives"))
    ),
}));
