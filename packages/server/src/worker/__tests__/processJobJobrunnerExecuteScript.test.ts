import { Job, Queue } from "bullmq";
import {
  JobKind,
  TJobData,
  TJobJobrunnerExecuteScriptData,
  TJobJobrunnerExecuteScriptResult,
} from "../workerTypes";

import mq from "../mq";
import { processJobJobrunnerExecuteScript } from "../processJobJobrunnerExecuteScript";

jest.mock("@octokit/request");
jest.mock("../../jobrunner/buildTsFile");
jest.mock("../mq");

/* eslint-disable @typescript-eslint/camelcase */
const commit = {
  id: "73d4ca7a118fc8570088d91829423540171de832",
  tree_id: "0a8278cd455ccd6f857b39c712258e411f71bcb7",
  distinct: true,
  message: "Make a sample test script",
  timestamp: "2020-05-23T02:50:52-07:00",
  url:
    "https://github.com/buttersstotch/upswyng/commit/73d4ca7a118fc8570088d91829423540171de832",
  author: {
    name: "Butters Stotch",
    email: "5778036+buttersstotch@users.noreply.github.com",
    username: "buttersstotch",
  },
  committer: {
    name: "Butters Stotch",
    email: "5778036+buttersstotch@users.noreply.github.com",
    username: "buttersstotch",
  },
  added: ["packages/server/src/jobrunner/exec/testScript.ts"],
  removed: [],
  modified: [],
};
/* eslint-enable @typescript-eslint/camelcase */

describe("processJobJobrunnerExecuteScript.ts", () => {
  let queue: Queue<TJobData>;
  let jobData: TJobJobrunnerExecuteScriptData;

  beforeEach(() => {
    jobData = {
      kind: JobKind.JobrunnerExecuteScript,
      filename: "packages/server/src/jobrunner/exec/testScript.ts",
      repository: "codeforboulder/upswyng",
      commit: commit,
      userId: "5e92431914c0ffc98b4f8e6c",
      processJobId: "process-job-id",
      nodeScript: "",
    };
    // we don't need any actual queue functionality; just need to be able to
    // make a job, so mock out most of it
    queue = ({
      client: new Promise(resolve =>
        resolve({
          addJob: jest.fn(),
        })
      ),
      toKey: () => "test-queue-key",
      keys: {
        wait: "WAIT",
        paused: "PAUSED",
        meta: "META",
        id: "ID",
        delayed: "DELAYED",
        priority: "PRIORITY",
        events: "EVENTS",
        delay: "DELAY",
      },
    } as unknown) as Queue<TJobData>;
  });

  it("should execute a successful script", async () => {
    jobData.nodeScript = `
      console.log("123");
      console.error("abc")
    `;

    const job: Job<
      TJobJobrunnerExecuteScriptData,
      TJobJobrunnerExecuteScriptResult
    > = await Job.create(queue, "test-job", jobData);
    job.updateProgress = jest.fn();

    const result = await processJobJobrunnerExecuteScript(job);

    expect(job.updateProgress).toHaveBeenNthCalledWith(1, 1);
    expect(job.updateProgress).toHaveBeenNthCalledWith(2, 100);

    expect(result.output).toMatch(/^stdout \d+: 123$/m);
    expect(result.output).toMatch(/^stderr \d+: abc$/m);

    expect(result.exitCode).toEqual(0);
    expect(result.startTime).toBeLessThan(result.endTime);

    // expect(mq.addJobJobrunnerExecuteScript).toHaveBeenCalledWith(
    //   "5e92431914c0ffc98b4f8e6c",
    //   {
    //     filename: jobData.filename,
    //     repository: jobData.repository,
    //     commit: jobData.commit,
    //     processJobId: job.id,
    //     nodeScript: result.source,
    //   }
    // );
  });

  it("should execute a script with a bug", async () => {
    jobData.nodeScript = `
      console.log(doesNotExist);
    `;

    const job: Job<
      TJobJobrunnerExecuteScriptData,
      TJobJobrunnerExecuteScriptResult
    > = await Job.create(queue, "test-job", jobData);
    job.updateProgress = jest.fn();

    const result = await processJobJobrunnerExecuteScript(job);

    expect(result.output).toContain(
      "ReferenceError: doesNotExist is not defined"
    );

    expect(result.exitCode).toBeGreaterThan(0);
  });

  it("allows script to update job progress", async () => {
    jobData.nodeScript = `
      console.info("UPDATE_JOB_PROGRESS_21");
      console.info("UPDATE_JOB_PROGRESS_69");
    `;

    const job: Job<
      TJobJobrunnerExecuteScriptData,
      TJobJobrunnerExecuteScriptResult
    > = await Job.create(queue, "test-job", jobData);
    job.updateProgress = jest.fn();

    const result = await processJobJobrunnerExecuteScript(job);

    expect(job.updateProgress).toHaveBeenNthCalledWith(1, 1); // from `processJobJobrunnerExecuteScript`
    expect(job.updateProgress).toHaveBeenNthCalledWith(2, 21); // from the script itself
    expect(job.updateProgress).toHaveBeenNthCalledWith(3, 69); // from the script itself
    expect(job.updateProgress).toHaveBeenNthCalledWith(4, 100); // from `processJobJobrunnerExecuteScript`

    expect(result.exitCode).toEqual(0);
  });
});
