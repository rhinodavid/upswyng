/**
 * Node app which executes jobs separate from the server.
 */

import * as dotenv from "dotenv";

import { Job, Worker } from "bullmq";
import {
  JobKind,
  TJobCheckLinksData,
  TJobCheckLinksResult,
  TJobCheckNewAlertsData,
  TJobCheckNewAlertsResult,
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
} from "./worker/workerTypes";
import {
  TJobData,
  TJobResult,
  TJobTestData,
  TJobTestResult,
} from "./worker/workerTypes";

import mongoose from "mongoose";
import mq from "./worker/mq";
import { processJobCheckLinks } from "./worker/processJobCheckLinks";
import { processJobCheckNewAlerts } from "./worker/processJobCheckNewAlerts";
import { processJobDestroyAllSessions } from "./worker/processJobDestroyAllSessions";
import { processJobJobrunnerCleanupScript } from "./worker/processJobJobrunnerCleanupScript";
import { processJobJobrunnerExecuteScript } from "./worker/processJobJobrunnerExecuteScript";
import { processJobJobrunnerProcessScript } from "./worker/processJobJobrunnerProcessScript";
import { processJobSyncAlgolia } from "./worker/processJobSyncAlgolia";
import { processJobTest } from "./worker/processJobTest";
import throng from "throng";

dotenv.config();

const {
  DATABASE_URL,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USER,

  ALGOLIA_APP_ID,
  ALGOLIA_WRITE_API_KEY,
  ALGOLIA_INDEX_NAME,

  NODE_ENV,
} = process.env;

const GITHUB_APP_ID = "66587";
const GITHUB_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAoXuVyCZCa7O0ZXvgSbX+j4aChP0UZEvwesWPVOwFOqNjFrfd
OzFM89Sk/0pmMfqTCb6R8Stw15/lKsr4Le90PTRWfXc5MPwhbdzieHTAB3AoT/Yn
bkCR7lF3ug/pI2KYZDfpgG1gHlKknReMnd7PNDRsnAIH4ZIhtzzlcq60h0xz+xVJ
Q9BxZXTe7NuT8G58ljS11G0z1lemDwtG8xmnQJPT8JwwaEgwmszMDsvRgiGu/kUY
6aUR3AekarWWqS18psdJrLOWlgbjbHIUn3UvrnP+HPCs6RNTk++lwMlwwZK1PhH+
nNUsKqLZfFzV7l89o8P3KCDIogncHi0C2dsvRwIDAQABAoIBAB8qIrYF7Dus6tvL
FHYlUYORig7waMcSgM6w4gCZrEisz6rKwT9zPE6yc0Vxrldm7Ims5a2NnLGAglHH
6i2zUNOfDjIYmEkD38+8GVj17zmAQ8dq0iFNBNzhjCG0gGH73T06LS5D7ZDskihf
KxwsrAB/PZa+LZczBJ7AeeewH9ccc6PGByosnaeK4cuPhStIHipHEatsf1M+wMjZ
de9N2KRnpJF+0BzFl/z7tqGHndrSS81jDwm/jvG6C//UESpdX3EWpIOH1a2WGALZ
TvsfpHJGS4dwJluGfd5jEttEAyoEyGlV2zXroDveuXiz9GeK60REJ6lEVUtVDm75
TZu6OgECgYEA0NwqT1OoCFLJhKMnZo1kqTeubWoPX3MAPtxLhIDWFVF5KYw5zLxB
nDnVmULZyOf/3MuJlaRIl4Xpk1JqW0XNNiSUHSIt0TrESSnlmxjsYn8Lx0lgvpes
Zobtq5/+mUx8F4jHr89AjwRuf6P3m4Jj50M93qy5gxdmvqYhwTCq7WECgYEAxe37
wb8uPj263sW1yCDd6lBU0QclGduwYQ2fj7+/mqHcd6/vEVe12H8CItJ1NBwnMUDX
wnxID8PhjbzOXo6jmUhFMioXJzXHlwCekrIelr2FFLTiZO7a1aKa+A6EmVGg2VV3
jeBjGlNm7LiMeNptRjOFXlKuD6DF5I1sUUP9dacCgYEAuhOszkfl6KR5TWZecAuA
pxIooOphD9TRXy+9SCvQj+WqYM3BoRoICjushYL9rPSlC/16couO8RApbUt73h1u
GtKz8tDEqSgGQHjHS0sFLyupPr+tJaDTw/RqQwGkPsfZts3xujyXc9Oq7qUSsMWW
ZC+QK5cPIC/1Jd21LP1DC4ECgYAgJjCvXrNPLs2so6aMNDJ3fcbZEPUIxzNWAFV7
juS7ZDEgS7ZkNb/2w2KAb3jUFwKSsHqbP36g+OspD5Lhrv+JxUBgDpAmMUkTEOmw
4DexumTkYSEozddDvh63zfvhv22F/6jkpZ7TRtq/9pXyh2AaeAHguUNGjJG4NvRy
Gr4PnwKBgCjf2u7VbDqowwh5bdDWJPMIe92ulVpdU73JCxxW6IkmELEOFx5KJNhi
uUd3CvnJ+suhr7WCCnTlH1N03dbAPfk/w9GVdcFmvpTXOuKSTKk8oFWo8wlx6SBK
74JPKoXVzfLgCy1NnBXmehn16vdL4EyDv8gmkfEKygJnGGtVGbRU
-----END RSA PRIVATE KEY-----`;

if (!GITHUB_APP_ID || !GITHUB_PRIVATE_KEY) {
  if (NODE_ENV === "development") {
    console.warn(
      "🐙 No GitHub credentials provided; GitHub integration will not be active"
    );
  } else {
    throw new Error(
      "Attempted to start worker in production with no GitHub access tokens"
    );
  }
}

mongoose
  .connect(DATABASE_URL, {
    useNewUrlParser: true,
    dbName: DATABASE_NAME,
    user: DATABASE_USER,
    pass: DATABASE_PASSWORD,
  })
  .then(
    () => console.log(`Connected to MongoDB instance at ${DATABASE_URL}`),
    e =>
      console.log(
        `There was an error connecting to the MongoDB instance at ${DATABASE_URL}:\n${e}`
      )
  )
  .catch(error => {
    throw new Error("Error when importing resources into Algolia:\n" + error);
  });

const { queueName, connection } = mq;

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
const workers = process.env.WEB_CONCURRENCY || 2;

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  const worker = new Worker<TJobData>(
    queueName,
    async (job: Job<TJobData, TJobResult>) => {
      switch (job.data.kind) {
        case JobKind.CheckLinks:
          return await processJobCheckLinks(
            job as Job<TJobCheckLinksData, TJobCheckLinksResult>
          );
        case JobKind.CheckNewAlerts:
          return await processJobCheckNewAlerts(
            job as Job<TJobCheckNewAlertsData, TJobCheckNewAlertsResult>
          );
        case JobKind.DestroyAllSessions:
          return await processJobDestroyAllSessions(
            job as Job<
              TJobDestroyAllSessionsData,
              TJobDestroyAllSessionsResult
            >,
            mongoose.connection
          );
        case JobKind.Test:
          return await processJobTest(job as Job<TJobTestData, TJobTestResult>);
        case JobKind.SyncAlgolia:
          return await processJobSyncAlgolia(
            job as Job<TJobSyncAlgoliaData, TJobSyncAlgoliaResult>,
            ALGOLIA_APP_ID,
            ALGOLIA_INDEX_NAME,
            ALGOLIA_WRITE_API_KEY
          );
        case JobKind.JobrunnerProcessScript:
          return await processJobJobrunnerProcessScript(
            job as Job<
              TJobJobrunnerProcessScriptData,
              TJobJobrunnerProcessScriptResult
            >
          );
        case JobKind.JobrunnerExecuteScript:
          return await processJobJobrunnerExecuteScript(
            job as Job<
              TJobJobrunnerExecuteScriptData,
              TJobJobrunnerExecuteScriptResult
            >
          );
        case JobKind.JobrunnerCleanupScript:
          return await processJobJobrunnerCleanupScript(
            job as Job<
              TJobJobrunnerCleanupScriptData,
              TJobJobrunnerCleanupScriptResult
            >,
            GITHUB_APP_ID ? parseInt(GITHUB_APP_ID) : null,
            GITHUB_PRIVATE_KEY
          );
        default:
          // TODO: Implement other jobs and then put an exhaustive requirement here
          throw new Error("unimplemented");
      }
    },
    { connection }
  );

  worker.on("active", job => {
    console.info(`${job.name}[${job.id}]\tstarted being processed`);
  });

  worker.on("completed", job => {
    console.info(`${job.name}[${job.id}]\tcompleted`);
  });

  worker.on("failed", (job, err) => {
    console.info(`${job.name}[${job.id}]\tfailed: ${err.message}`);
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
