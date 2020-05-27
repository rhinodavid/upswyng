import fs from "fs";
import path from "path";
import rollup from "rollup";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const loadConfigFile = require("rollup/dist/loadConfigFile");

/**
 * Takes typescript source and uses `jobrunner.rollup.config.js` to transpile
 * into commonjs javascript
 *
 * See https://rollupjs.org/guide/en/#javascript-api
 */
async function buildTsFile(source: string, jobName: string): Promise<string> {
  // write source to temp file
  const tmpFile = `${__dirname}/${jobName}.tmp.ts`;
  fs.writeFileSync(tmpFile, source);
  const configPath = path.resolve(__dirname).match(/__build__$/)
    ? path.resolve(__dirname, "../../..", "jobrunner.rollup.config.mjs")
    : path.resolve(__dirname, "../../../..", "jobrunner.rollup.config.mjs");
  return loadConfigFile(configPath, {}).then(async ({ options }) => {
    options = {
      ...options[0],
      input: path.resolve(`${__dirname}/${jobName}.tmp.ts`),
    };

    const bundle = await rollup.rollup(options);
    const { output } = await bundle.generate({ format: "commonjs" });

    const code = output.filter(chunk => chunk.type !== "asset");
    if (code.length !== 1) {
      throw new Error(
        "buildTsFile generated more than one output file which was not an asset"
      );
    }

    const result = (code[0] as rollup.OutputChunk).code;
    fs.unlinkSync(tmpFile);
    return result;
  });
}

export default buildTsFile;
