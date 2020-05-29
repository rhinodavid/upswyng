/**
 * Javascript interface to the BullMQ queue.
 */

import * as dotenv from "dotenv";

import { Job, Queue, QueueEvents, QueueScheduler } from "bullmq";
import {
  JobKind,
  TJobCheckLinksData,
  TJobCheckLinksResult,
  TJobCheckNewAlertsData,
  TJobCheckNewAlertsResult,
  TJobData,
  TJobDestroyAllSessionsData,
  TJobDestroyAllSessionsResult,
  TJobJobrunnerCleanupScriptData,
  TJobJobrunnerCleanupScriptResult,
  TJobJobrunnerExecuteScriptData,
  TJobJobrunnerExecuteScriptResult,
  TJobJobrunnerProcessScriptData,
  TJobJobrunnerProcessScriptResult,
  TJobSyncAlgoliaData,
  TJobSyncAlgoliaResult,
  TJobTestData,
  TJobTestResult,
} from "./workerTypes";

import { ObjectID } from "bson";
import { TCommit } from "../utility/GithubWebhookMiddleware";
import getName from "@afuggini/namegenerator";
import parseRedisUrl from "../utility/parseRedisUrl";

dotenv.config();

const statuses = {
  active: null,
  completed: null,
  delayed: null,
  failed: null,
  paused: null,
  waiting: null,
};

const { REDIS_URL, WORKER_JOB_QUEUE_NAME, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

const queueName = WORKER_JOB_QUEUE_NAME || "upswyng-test-queue";

if (dev && queueName.toLowerCase().includes("prod")) {
  throw new Error(
    "💩 You're attempting to use the production worker queue in a dev enviroment."
  );
}

export type TCounts = { [K in keyof typeof statuses]: number };

const connection = parseRedisUrl(REDIS_URL || "redis://localhost:6379");

let queueEvents: QueueEvents;
let queue: Queue<TJobData>;
try {
  queueEvents = new QueueEvents(queueName, { connection });
} catch (e) {
  console.error(`Error creating QueueEvents: ${e}`);
}

try {
  queue = new Queue<TJobData>(queueName, { connection });
} catch (e) {
  console.error(`Error creating Queue: ${e}`);
}

try {
  new QueueScheduler(queueName, { connection });
} catch (e) {
  console.error(`Error creating Queue Scheduler: ${e}`);
}

const getCounts = async (): Promise<TCounts> => {
  const counts = await queue.getJobCounts(...Object.keys(statuses));
  return counts as TCounts;
};

async function addJobTest(
  name: string = getName("-"),
  delayMs: number = 0,
  shouldFail = false,
  userId: string = null
): Promise<Job<TJobTestData, TJobTestResult>> {
  return queue.add(
    name,
    { kind: JobKind.Test, shouldFail, userId },
    {
      priority: 1,
      jobId: new ObjectID().toHexString(),
      delay: delayMs,
    }
  );
}

async function addJobCheckLinks(
  name: string = getName("-"),
  userId
): Promise<Job<TJobCheckLinksData, TJobCheckLinksResult>> {
  return queue.add(
    name,
    { kind: JobKind.CheckLinks, userId },
    {
      priority: 2,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobCheckNewAlerts(
  name: string = getName("-"),
  userId
): Promise<Job<TJobCheckNewAlertsData, TJobCheckNewAlertsResult>> {
  return queue.add(
    name,
    { kind: JobKind.CheckNewAlerts, userId },
    {
      priority: 2,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobDestroyAllSessions(
  name: string = getName("-"),
  userId
): Promise<Job<TJobDestroyAllSessionsData, TJobDestroyAllSessionsResult>> {
  return queue.add(
    name,
    { kind: JobKind.DestroyAllSessions, userId },
    {
      priority: 80,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobJobrunnerProcessScript(
  name: string = getName("-"),
  userId /* (expect the upswyng bot) */,
  filename: string,
  repository: string,
  commit: TCommit
): Promise<
  Job<TJobJobrunnerProcessScriptData, TJobJobrunnerProcessScriptResult>
> {
  return queue.add(
    name,
    {
      kind: JobKind.JobrunnerProcessScript,
      userId,
      filename,
      repository,
      commit,
    },
    {
      priority: 50,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobJobrunnerExecuteScript(
  userId /* (expect the upswyng bot) */,
  options: {
    filename: string;
    repository: string; // ex: codeforboulder/upswyng
    commit: TCommit;
    processJobId: string; // id of the step 1 job
    nodeScript: string;
    name?: string;
  }
): Promise<
  Job<TJobJobrunnerExecuteScriptData, TJobJobrunnerExecuteScriptResult>
> {
  const name = options.name ?? getName("-");
  return queue.add(
    name,
    { userId, kind: JobKind.JobrunnerExecuteScript, ...options },
    {
      priority: 50,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobJobrunnerCleanupScript(
  userId /* (expect the upswyng bot) */,
  options: {
    executeJobId: string;
    commit: TCommit;
    endTime: number; // generated in step 2
    exitCode: number; // generated in step 2
    filename: string;
    nodeScript: string; // generated in step 1
    output: string; // generated in step 2
    processJobId: string; // id of the step 1 job
    repository: string; // ex: codeforboulder/upswyng
    startTime: number; // generated in step 2
    name?: string;
  }
): Promise<
  Job<TJobJobrunnerCleanupScriptData, TJobJobrunnerCleanupScriptResult>
> {
  const name = options.name ?? getName("-");
  return queue.add(
    name,
    { userId, kind: JobKind.JobrunnerCleanupScript, ...options },
    {
      priority: 50,
      jobId: new ObjectID().toHexString(),
    }
  );
}

async function addJobSyncAlgolia(
  name: string = getName("-"),
  userId
): Promise<Job<TJobSyncAlgoliaData, TJobSyncAlgoliaResult>> {
  return queue.add(
    name,
    { kind: JobKind.SyncAlgolia, userId },
    {
      priority: 2,
      jobId: new ObjectID().toHexString(),
    }
  );
}

const mq = {
  addJobCheckLinks,
  addJobCheckNewAlerts,
  addJobDestroyAllSessions,
  addJobJobrunnerCleanupScript,
  addJobJobrunnerExecuteScript,
  addJobJobrunnerProcessScript,
  addJobSyncAlgolia,
  addJobTest,
  connection,
  getCounts,
  queue,
  queueEvents,
  queueName,
  statuses,
};

Object.freeze(mq);
export default mq;
