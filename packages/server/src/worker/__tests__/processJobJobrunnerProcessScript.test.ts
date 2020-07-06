import * as BuildTsFileModule from "../../jobrunner/buildTsFile";
/* eslint-disable @typescript-eslint/camelcase */
import * as OctokitRequest from "@octokit/request";

import { Job, Queue } from "bullmq";
import {
  JobKind,
  TJobData,
  TJobJobrunnerProcessScriptData,
  TJobJobrunnerProcessScriptResult,
} from "../workerTypes";

import mq from "../mq";
import { processJobJobrunnerProcessScript } from "../processJobJobrunnerProcessScript";

jest.mock("@octokit/request");
jest.mock("../../jobrunner/buildTsFile");
jest.mock("../mq");

// import {
//   AppOptions,
//   InstallationAccessTokenOptions,
// } from "@octokit/app/dist-types/types";
// import { App } from "@octokit/app";
// jest.mock("@octokit/app");
// const getSignedJsonWebTokenMock: () => string = jest.fn();
// const getInstallationAccessTokenMock: (
//   options: InstallationAccessTokenOptions
// ) => Promise<string> = jest.fn();
// App.constructor = function({ id, privateKey, baseUrl, cache }: AppOptions) {
//   this._cache = cache;
//   this._baseUrl = baseUrl;
//   this._id = id;
//   this._privateKey = privateKey;
//   this.getSignedJsonWebToken = getSignedJsonWebTokenMock;
//   this.getInstallationAccessToken = getInstallationAccessTokenMock;
// };

const successfulGithubCommitResponse = {
  status: 200,
  url:
    "https://api.github.com/repos/buttersstotch/upswyng/commits/73d4ca7a118fc8570088d91829423540171de832?path=packages%2Fserver%2Fsrc%2Fjobrunner%2Fexec%2Fdummy.ts",
  headers: {
    "accept-ranges": "bytes",
    "access-control-allow-origin": "*",
    "access-control-expose-headers":
      "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, Deprecation, Sunset",
    "cache-control": "public, max-age=60, s-maxage=60",
    connection: "close",
    "content-encoding": "gzip",
    "content-length": 985,
    "content-security-policy": "default-src 'none'",
    "content-type": "application/json; charset=utf-8",
    date: "Tue, 26 May 2020 00:45:29 GMT",
    etag: 'W/"c2891d798b0d4041ad4c8cc38d6bcb1c"',
    "last-modified": "Sat, 23 May 2020 09:50:52 GMT",
    "referrer-policy":
      "origin-when-cross-origin, strict-origin-when-cross-origin",
    server: "GitHub.com",
    status: "200 OK",
    "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
    vary: "Accept, Accept-Encoding, Accept, X-Requested-With",
    "x-content-type-options": "nosniff",
    "x-frame-options": "deny",
    "x-github-media-type": "github.v3; param=json",
    "x-github-request-id": "CCB9:0E11:205595:475452:5ECC66A9",
    "x-ratelimit-limit": "60",
    "x-ratelimit-remaining": "52",
    "x-ratelimit-reset": "1590454185",
    "x-xss-protection": "1; mode=block",
  },
  data: {
    sha: "73d4ca7a118fc8570088d91829423540171de832",
    node_id:
      "MDY6Q29tbWl0MjE5OTQxNTg0OjczZDRjYTdhMTE4ZmM4NTcwMDg4ZDkxODI5NDIzNTQwMTcxZGU4MzI=",
    commit: {
      author: {
        name: "Butters Stotch",
        email: "5778036+buttersstotch@users.noreply.github.com",
        date: "2020-05-23T09:50:52Z",
      },
      committer: {
        name: "Butters Stotch",
        email: "5778036+buttersstotch@users.noreply.github.com",
        date: "2020-05-23T09:50:52Z",
      },
      message: "Make a sample test script",
      tree: {
        sha: "0a8278cd455ccd6f857b39c712258e411f71bcb7",
        url:
          "https://api.github.com/repos/buttersstotch/upswyng/git/trees/0a8278cd455ccd6f857b39c712258e411f71bcb7",
      },
      url:
        "https://api.github.com/repos/buttersstotch/upswyng/git/commits/73d4ca7a118fc8570088d91829423540171de832",
      comment_count: 0,
      verification: {
        verified: false,
        reason: "unsigned",
        signature: null,
        payload: null,
      },
    },
    url:
      "https://api.github.com/repos/buttersstotch/upswyng/commits/73d4ca7a118fc8570088d91829423540171de832",
    html_url:
      "https://github.com/buttersstotch/upswyng/commit/73d4ca7a118fc8570088d91829423540171de832",
    comments_url:
      "https://api.github.com/repos/buttersstotch/upswyng/commits/73d4ca7a118fc8570088d91829423540171de832/comments",
    author: {
      login: "buttersstotch",
      id: 5778036,
      node_id: "MDQ6VXNlcjU3NzgwMzY=",
      avatar_url: "https://avatars2.githubusercontent.com/u/5778036?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/buttersstotch",
      html_url: "https://github.com/buttersstotch",
      followers_url: "https://api.github.com/users/buttersstotch/followers",
      following_url:
        "https://api.github.com/users/buttersstotch/following{/other_user}",
      gists_url: "https://api.github.com/users/buttersstotch/gists{/gist_id}",
      starred_url:
        "https://api.github.com/users/buttersstotch/starred{/owner}{/repo}",
      subscriptions_url:
        "https://api.github.com/users/buttersstotch/subscriptions",
      organizations_url: "https://api.github.com/users/buttersstotch/orgs",
      repos_url: "https://api.github.com/users/buttersstotch/repos",
      events_url: "https://api.github.com/users/buttersstotch/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/buttersstotch/received_events",
      type: "User",
      site_admin: false,
    },
    committer: {
      login: "buttersstotch",
      id: 5778036,
      node_id: "MDQ6VXNlcjU3NzgwMzY=",
      avatar_url: "https://avatars2.githubusercontent.com/u/5778036?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/buttersstotch",
      html_url: "https://github.com/buttersstotch",
      followers_url: "https://api.github.com/users/buttersstotch/followers",
      following_url:
        "https://api.github.com/users/buttersstotch/following{/other_user}",
      gists_url: "https://api.github.com/users/buttersstotch/gists{/gist_id}",
      starred_url:
        "https://api.github.com/users/buttersstotch/starred{/owner}{/repo}",
      subscriptions_url:
        "https://api.github.com/users/buttersstotch/subscriptions",
      organizations_url: "https://api.github.com/users/buttersstotch/orgs",
      repos_url: "https://api.github.com/users/buttersstotch/repos",
      events_url: "https://api.github.com/users/buttersstotch/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/buttersstotch/received_events",
      type: "User",
      site_admin: false,
    },
    parents: [
      {
        sha: "ef3de4923ffaf76b22e47b52b220621a81c560e3",
        url:
          "https://api.github.com/repos/buttersstotch/upswyng/commits/ef3de4923ffaf76b22e47b52b220621a81c560e3",
        html_url:
          "https://github.com/buttersstotch/upswyng/commit/ef3de4923ffaf76b22e47b52b220621a81c560e3",
      },
    ],
    stats: { total: 1, additions: 1, deletions: 0 },
    files: [
      {
        sha: "cb0ff5c3b541f646105198ee23ac0fc3d805023e",
        filename: "packages/server/src/jobrunner/exec/testScript.ts",
        status: "added",
        additions: 1,
        deletions: 0,
        changes: 1,
        blob_url:
          "https://github.com/buttersstotch/upswyng/blob/73d4ca7a118fc8570088d91829423540171de832/packages/server/src/jobrunner/exec/testScript.ts",
        raw_url:
          "https://github.com/buttersstotch/upswyng/raw/73d4ca7a118fc8570088d91829423540171de832/packages/server/src/jobrunner/exec/testScript.ts",
        contents_url:
          "https://api.github.com/repos/buttersstotch/upswyng/contents/packages/server/src/jobrunner/exec/testScript.ts?ref=73d4ca7a118fc8570088d91829423540171de832",
        patch: "@@ -0,0 +1 @@\n+export {};",
      },
    ],
  },
};

const successfulGithubFileResponse = {
  status: 200,
  url:
    "https://api.github.com/repos/buttersstotch/upswyng/git/blobs/cb0ff5c3b541f646105198ee23ac0fc3d805023e",
  headers: {
    "access-control-allow-origin": "*",
    "access-control-expose-headers":
      "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, Deprecation, Sunset",
    "cache-control": "private, max-age=60, s-maxage=60",
    connection: "close",
    "content-encoding": "gzip",
    "content-security-policy": "default-src 'none'",
    "content-type": "application/json; charset=utf-8",
    date: "Sat, 23 May 2020 22:43:02 GMT",
    etag: 'W/"03a948d9e24aa416b78f76165f194ea2"',
    "referrer-policy":
      "origin-when-cross-origin, strict-origin-when-cross-origin",
    server: "GitHub.com",
    status: "200 OK",
    "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
    "transfer-encoding": "chunked",
    vary:
      "Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding, Accept, X-Requested-With, Accept-Encoding",
    "x-content-type-options": "nosniff",
    "x-frame-options": "deny",
    "x-github-media-type": "github.v3; format=json",
    "x-github-request-id": "E7D5:42DB:1A035E:1EE754:5EC9A6F5",
    "x-ratelimit-limit": "5000",
    "x-ratelimit-remaining": "4994",
    "x-ratelimit-reset": "1590277253",
    "x-xss-protection": "1; mode=block",
  },
  data: {
    sha: "cb0ff5c3b541f646105198ee23ac0fc3d805023e",
    node_id:
      "MDQ6QmxvYjIxOTk0MTU4NDpjYjBmZjVjM2I1NDFmNjQ2MTA1MTk4ZWUyM2FjMGZjM2Q4MDUwMjNl",
    size: 11,
    url:
      "https://api.github.com/repos/buttersstotch/upswyng/git/blobs/cb0ff5c3b541f646105198ee23ac0fc3d805023e",
    content:
      /* see https://github.com/rhinodavid/upswyng/commit/b606770107ad207d316e2d6a1c14ed3acd5e9ab1 for actual source */
      "Y29uc3QgY291bnQgPSAoeDogbnVtYmVyKTogdm9pZCA9PiB7CiAgZm9yIChs\n" +
      "ZXQgaSA9IDA7IGkgPCB4OyBpKyspIHsKICAgIGNvbnNvbGUubG9nKGBDb3Vu\n" +
      "dDogJHtpICsgMX1gKTsKICB9Cn07Cgpjb3VudCgzKTsKCmV4cG9ydCB7fTsK\n",
    encoding: "base64",
  },
};

describe("processJobJobrunnerProcessScript.ts", () => {
  let queue: Queue<TJobData>;
  let OctokitRequestMock: jest.Mocked<typeof OctokitRequest>;
  let BuildTsFileModuleMock: jest.Mocked<typeof BuildTsFileModule>;

  beforeEach(() => {
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
    OctokitRequestMock = OctokitRequest as jest.Mocked<typeof OctokitRequest>;
    BuildTsFileModuleMock = BuildTsFileModule as jest.Mocked<
      typeof BuildTsFileModule
    >;
  });

  it("should fetch the source file", async () => {
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
    const jobData: TJobJobrunnerProcessScriptData = {
      kind: JobKind.JobrunnerProcessScript,
      filename: "packages/server/src/jobrunner/exec/testScript.ts",
      repository: "codeforboulder/upswyng",
      commit: commit,
      userId: "5e92431914c0ffc98b4f8e6c",
    };

    const job: Job<
      TJobJobrunnerProcessScriptData,
      TJobJobrunnerProcessScriptResult
    > = await Job.create(queue, "test-job", jobData);
    job.updateProgress = jest.fn();

    OctokitRequestMock.request
      .mockResolvedValueOnce(successfulGithubCommitResponse)
      .mockResolvedValueOnce(successfulGithubFileResponse);

    BuildTsFileModuleMock.default.mockResolvedValueOnce("some fake js");

    const result = await processJobJobrunnerProcessScript(job);

    expect(job.updateProgress).toHaveBeenNthCalledWith(1, 25);
    expect(job.updateProgress).toHaveBeenNthCalledWith(2, 50);
    expect(job.updateProgress).toHaveBeenNthCalledWith(3, 100);

    expect(OctokitRequestMock.request).toHaveBeenCalledTimes(2);
    expect(result.source).toMatch(
      /const count = \(x: number\): void => {\s+for \(let i = 0; i < x; i\+\+\) {\s+console\.log\(`Count: \${i \+ 1}`\);\s+}\s+};\s+count\(3\);\s+export {};/
    ); // successfulGithubFileResponse.data.content converted from base64; jest gets angry if you try to match a string with a semicolon;
    expect(BuildTsFileModuleMock.default).toHaveBeenCalledWith(
      result.source,
      "test-job"
    );
    expect(mq.addJobJobrunnerExecuteScript).toHaveBeenCalledWith(
      "5e92431914c0ffc98b4f8e6c",
      {
        filename: jobData.filename,
        repository: jobData.repository,
        commit: jobData.commit,
        processJobId: job.id,
        nodeScript: result.nodeScript,
      }
    );
    expect(result.nodeScript).toEqual("some fake js");
  });
});
