/**
 * TODO: Write what this step does
 */
import {
  JobKind,
  TJobJobrunnerExecuteScriptData,
  TJobJobrunnerExecuteScriptResult,
} from "./workerTypes";

import { Job } from "bullmq";
import fs from "fs";
import mq from "../worker/mq";
import path from "path";
import queue from "./mq";
import { spawn } from "child_process";

export async function processJobJobrunnerExecuteScript(
  job: Job<TJobJobrunnerExecuteScriptData, TJobJobrunnerExecuteScriptResult>
): Promise<TJobJobrunnerExecuteScriptResult> {
  return new Promise(resolve => {
    const { filename, repository, commit, processJobId, nodeScript } = job.data;

    // https://regex101.com/r/vvJv5s/5
    const match = filename.match(
      /^packages\/server\/src\/jobrunner\/exec\/(?<name>.*)\.[t|j]s$/
    );

    if (!match) {
      throw new Error(`Unexpected filename: ${filename}`);
    }

    const tempFileName = `${match.groups.name}.tmp.js`;
    console.info(`${job.name}[${job.id}]\t: Writing temp file ${tempFileName}`);

    // write temp file -- make sure the relative paths match up from the source
    fs.writeFileSync(tempFileName, nodeScript);
    job.updateProgress(1);
    const startTime = Date.now();
    const childProcess = spawn("node", [tempFileName]);
    let output = "";

    childProcess.stdout.on("data", data => {
      const match = data
        .toString()
        .match(/^UPDATE_JOB_PROGRESS_(?<prog>\d{1,3})/);
      if (match) {
        job.updateProgress(parseInt(match.groups.prog));
      } else {
        output += `stdout ${Date.now()}: ${data.toString()}`;
      }
    });

    childProcess.stderr.on("data", data => {
      output += `stderr ${Date.now()}: ${data.toString()}`;
    });

    childProcess.on("close", code => {
      // Note that the job is still completed successful even if the script exits
      // with an error. The script log should be examined and the problems corrected
      // and a new script submitted to the repo
      try {
        fs.unlinkSync(tempFileName);
      } catch (e) {
        console.error(`Failed to delete temp file at ${tempFileName}`);
      }
      const endTime = Date.now();
      const exitCode = parseInt(code.toString());

      mq.addJobJobrunnerCleanupScript(job.data.userId, {
        commit: job.data.commit,
        endTime,
        exitCode,
        filename: job.data.filename,
        nodeScript,
        output,
        processJobId: job.data.processJobId,
        executeJobId: job.id,
        repository: job.data.repository,
        startTime,
      });

      job.updateProgress(100);

      resolve({
        kind: JobKind.JobrunnerExecuteScript,
        output,
        startTime,
        endTime,
        exitCode: parseInt(code.toString()),
      });
    });
  });
}
