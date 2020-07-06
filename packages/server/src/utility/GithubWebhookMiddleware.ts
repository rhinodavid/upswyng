import { Webhooks } from "@octokit/webhooks";
import http from "http";
import mq from "../worker/mq";

export type TWebhookPayloadPush = Webhooks.WebhookPayloadPush;
export type TCommit = Webhooks.WebhookPayloadCheckSuiteCheckSuiteHeadCommit & {
  url: string;
  added: string[]; // ex: [ 'packages/server/src/utility/GithubWebhookMiddleware.ts' ]
  modified: string[];
  removed: string[];
};

let middleware: (
  request: http.IncomingMessage,
  response: http.ServerResponse,
  next?: (err?: any) => void
) => void | Promise<void>;

async function handlePushEvent(event: TWebhookPayloadPush): Promise<void> {
  const GITHUB_REPO = "rhinodavid/upswyng";
  const BRANCH_FOR_SCRIPTS = "master";

  const repository = event.repository.full_name; // ex: "codeforboulder/upswyng"
  const branch: string = (function computeBranch(
    event: TWebhookPayloadPush
  ): string {
    const ref = event.ref; // ex: "refs/heads/github_webhook"
    const refMatch = ref.match(/refs\/heads\/(?<branch>\w+)/);
    if (!refMatch) {
      throw new Error(`Received unexpected ref format: ${ref}`);
    }
    return refMatch.groups.branch;
  })(event);

  if (branch !== BRANCH_FOR_SCRIPTS || repository !== GITHUB_REPO) {
    // This isn't a commit we care about
    console.info(`Passing up ${branch} ${repository}`);
    return;
  }

  // this is the repo and branch we're worried about
  // check out the added files to see if we're concerened with them

  const headCommit = event.head_commit as TCommit;
  console.log("HEAD COMMIT");
  console.log(headCommit);
  // TODO: Parameterize regex
  const addedSourceFiles = headCommit.added.filter(filename =>
    /packages\/server\/src\/jobrunner\/exec\/.*\.ts/.test(filename)
  );

  if (!addedSourceFiles.length) {
    // no applicable files were added in commit
    console.info(`Passing up for source files: ${addedSourceFiles}`);
    return;
  }

  addedSourceFiles.forEach(async filename => {
    try {
      const job = await mq.addJobJobrunnerProcessScript(
        undefined,
        process.env.BOT_USER_ID,
        filename,
        repository,
        headCommit
      );
      console.info(
        `Added Jobrunner Process Script job to the queue: ${job.name}`
      );
    } catch (e) {
      console.error(
        `Failed to add a Jobrunner Process Script job to the queue: ${e}`
      );
    }
  });
}

export function create(
  githubWebhooksSecret: string,
  dev: boolean
): typeof middleware {
  if (middleware) {
    return middleware;
  }
  // Github web hooks
  // Run proxy for local development:
  // yarn workspace @upswyng/server smee --target http://localhost:3000/api/github.push --url https://smee.io/2asxLtwrVARO9k6
  const webhooks = new Webhooks({
    path: "/api/github/push",
    secret: githubWebhooksSecret,
  });

  webhooks.on("error", e => {
    console.error("Github webhooks error:\n", e);
  });

  webhooks.on(["push", "ping"], async event => {
    console.log("webhook");
    try {
      const { id, name, payload } = event;
      await webhooks.verify(payload, /* signature = */ webhooks.sign(payload));
      console.info("Github " + name + "event received: ", id);
      if (dev) {
        console.info(payload);
      }

      if (name === "push") {
        handlePushEvent(event.payload as Webhooks.WebhookPayloadPush);
      }

      // do stuff with the push webhook
    } catch (e) {
      console.error("Error processing github webhook:\n", e);
    }
  });
  middleware = webhooks.middleware;
  return middleware;
}
