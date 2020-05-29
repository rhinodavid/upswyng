import {
  JobKind,
  TJobJobrunnerProcessScriptData,
  TJobJobrunnerProcessScriptResult,
} from "./workerTypes";

// import { App } from "@octokit/app";
import { Job } from "bullmq";
import buildTsFile from "../jobrunner/buildTsFile";
import { endpoint } from "@octokit/endpoint";
import queue from "./mq";
import { request } from "@octokit/request";

// const APP_ID = 66027;
// const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
// MIIEogIBAAKCAQEAzeQVBu7pTUNDm3D0sgR4w4pZfkczWYzL1YJMN1yiZxWlSB0Y
// Jh4rfBBmAcoZHjb57fSiwYxhEgF9VVcXOzVtcoRbgXrSiyIw3sFfA/zNfXM5nAGn
// FIc0Yav/Gw/nxECOR/PtX4H5D8heYHj45iSm9AaMA23KZhbL8NsmLUjzBzdoAlCy
// kg1pE1mi3KgLvqtXDXH+QH5/mHI76mvgOSWwFt0DmZjH3yNYSbty5Vvpfu3hWOFP
// ns3CiV+w+Qglu4826Z8IxdzLpMQeaPl+Q1mnT2McVRl/P6Q/TxZDYAPNAmenNPJ6
// RtZ4PELaBv9p3erVOpgOKd+fA2M+uJe//Egh/wIDAQABAoIBAEk/4As7bF1ElQT0
// RtoepShMTFKU2jv9z3cCiEMZ/d1W4hqp3zGQgj/9RY1VbWJGhNyXsF/TpaVWSlTW
// SzmRZILdfACwxb8iRui5OyicBC+hktlh7SNshsJJAtWJ7xbvMK+ApO7ZutZWnt0L
// rOGUIKGowp9lrCBt89iY3xg1X+EsvarC4arryAEX9d44DXWUH14CM+GgoivP9ego
// d127SqAqLBJT2NZW/zcHcCOBDf/D866C5Ma3tDFBIdDVV+a2tERCCXfVc9HGiwkS
// F6KxgGitiIjmIfkOvmdbStQ6ap4/WbvuLH5RO8GZCCAFC1MkUYDlOvlMrOV3bSva
// enBZjaECgYEA7cDcUv8CsYnRluWOUGSuQWejxgpFagLKAXa1Saq54HIE24FSsMiu
// 4PoScZAQvFW5T+UFKNbkmsN5wJ7iCRJr9KyotiDeZpkkBDLPKjcbmrEuEJKq940v
// JJMJlUghCaiPYeo4V07/bmTUuO3bKECw9fzJwhGEzDozrpVDX0yy20UCgYEA3bE4
// ggfOCJnTVYxm2yFniEBLA8Zx9fVgLvGwW1/Latt4Uv9fe/GydjDjYb7cOODOds+e
// +yb9GzOt9AULW40W107xhEus+VJ70SK9teOmO8MqRcr3b5hGNJ+SYyyDhFIjMhBF
// 1g/M6hn1NAP1zEMnSZkrfk9YKgcx59nQa/xaOnMCgYAbM3eBn19lhIkQJI9Vr08o
// eH0KSV6LtGn8JOK03O2LOkBIBNG7HBq17qZxi7P+eChNdbxTYdKhyj+BxCvEMfFb
// +u0KeVQ4lMjEGjQNdmSYHDFTABTDYcnE+3WbOLde7YQKBcwQYR9kN/EGf2AViOE2
// I4fJxktVOktza+xbWOEVqQKBgBc6oZQmYzVNgPJe0sw1NNb2/aU4nupJurlQg80f
// PX5F3ta7gXLIQY3W04yDZinjjF6wpJTmYfD+ukRuXuFJ6FHJKM9W6pn5RZYFUOGF
// J/7tFTnY6ZJc30ZWTg1sNZ+gx6VQRTEH2M3SyHmZzKCJjM1OaltCzxcgR99mWEto
// Vr/3AoGAC+ikHfiX7AtjoFl0Y9Fak+cjPa/yFM6Dm+Mccd8+taCylPcDz1sr2QT2
// Z0W+8R5HlfGX4dN2ln++KDTPZuSAoyk7UxssJkntw+vmUkcWaul8gjVn5g45nmBq
// Bu7v6ywnp2g45i4hsooWgucXOG9YXB2EtgKZyox6cQ0kXN0hwVM=
// -----END RSA PRIVATE KEY-----`;

// async function setupGithubApp(
//   id: number,
//   privateKey: string
// ): Promise<{ app: App; installationId: number }> {
//   const CACHE = {};
//   const githubApp = new App({
//     id,
//     privateKey,
//     cache: {
//       get(key) {
//         return CACHE[key];
//       },
//       set(key, value) {
//         CACHE[key] = value;
//       },
//     },
//   });
//   const jwt = githubApp.getSignedJsonWebToken();

//   // Example of using authenticated app to GET an individual installation
//   // https://developer.github.com/v3/apps/#find-repository-installation
//   const { data } = await request("GET /repos/:owner/:repo/installation", {
//     owner: "rhinodavid",
//     repo: "upswyng",
//     headers: {
//       authorization: `Bearer ${jwt}`,
//       accept: "application/vnd.github.machine-man-preview+json",
//     },
//     mediaType: { previews: ["machine-man"] },
//   });

//   // contains the installation id necessary to authenticate as an installation
//   const installationId = data.id;

//   return { app: githubApp, installationId };
// }

// let githubApp: App;
// let installationId: number;

// setupGithubApp(APP_ID, PRIVATE_KEY)
//   .then(({ app: _app, installationId: _installationId }) => {
//     githubApp = _app;
//     installationId = _installationId;
//     console.info("🐙 Successfully authenticated with GitHub");
//   })
//   .catch(error => {
//     console.info("👎 Failed to authenticate with GitHub:\n", error);
//   });

/**
 */
export async function processJobJobrunnerProcessScript(
  job: Job<TJobJobrunnerProcessScriptData, TJobJobrunnerProcessScriptResult>
  /* add github credentials */
): Promise<TJobJobrunnerProcessScriptResult> {
  const { filename, repository, commit } = job.data;

  const repositoryMatch = repository.match(/(?<owner>[^\/]+)\/(?<repo>\w+)/);
  if (!repositoryMatch) {
    throw new Error(`Unexpected repository string: ${repository}`);
  }
  const { owner, repo } = repositoryMatch.groups;

  // const installationAccessToken = await githubApp.getInstallationAccessToken({
  //   installationId,
  // });

  const r = await request(
    endpoint("GET /repos/:owner/:repo/commits/:ref", {
      headers: {
        // authorization: `token ${installationAccessToken}`,
      },
      mediaType: { format: "json" },
      owner,
      repo,
      ref: commit.id,
      path: filename,
    })
  );

  job.updateProgress(25);

  const data = r.data;
  const files = data.files as {
    sha: string;
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: "modified" | "added" | "deleted";
    raw_url: string; // "https://github.com/octocat/Hello-World/raw/7ca483543807a51b6079e54ac4cc392bc29ae284/file1.txt"
    blob_url: string; // "https://github.com/octocat/Hello-World/blob/7ca483543807a51b6079e54ac4cc392bc29ae284/file1.txt"
    patch: string; // ex: "@@ -29,7 +29,7 @@\n.....";
  }[];

  job.updateProgress(50);

  const file = files.filter(f => f.filename === filename)[0];

  const response = await request(
    endpoint("GET /repos/:owner/:repo/git/blobs/:file_sha", {
      headers: {
        // authorization: `token ${installationAccessToken}`,
      },
      owner,
      repo,
      // eslint-disable-next-line @typescript-eslint/camelcase
      file_sha: file.sha,
    })
  );

  const buffer = Buffer.from(response.data.content, response.data.encoding);
  const source = buffer.toString("utf-8");

  const output = await buildTsFile(source, job.name);

  await queue.addJobJobrunnerExecuteScript(job.data.userId, {
    filename: job.data.filename,
    repository: job.data.repository,
    commit: job.data.commit,
    processJobId: job.id,
    nodeScript: source,
  });

  job.updateProgress(100);

  return { kind: JobKind.JobrunnerProcessScript, source, nodeScript: output };
}
