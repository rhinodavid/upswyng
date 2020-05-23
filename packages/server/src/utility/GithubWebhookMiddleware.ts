import { Webhooks } from "@octokit/webhooks";
import http from "http";

let middleware: (
  request: http.IncomingMessage,
  response: http.ServerResponse,
  next?: (err?: any) => void
) => void | Promise<void>;

async function handlePushEvent(
  event: Webhooks.WebhookPayloadPush
): Promise<void> {
  console.info("Handling push event");
  console.log(event);
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
