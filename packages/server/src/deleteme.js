import { App } from "@octokit/app";
import { endpoint } from "@octokit/endpoint";
import { request } from "@octokit/request";

const APP_ID = 66587;
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
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
// TODO (rhinodavid): Extract
async function setupGithubApp(id, privateKey) {
  const CACHE = {};
  const githubApp = new App({
    id,
    privateKey,
    cache: {
      get(key) {
        return CACHE[key];
      },
      set(key, value) {
        CACHE[key] = value;
      },
    },
  });
  const jwt = githubApp.getSignedJsonWebToken();

  // Example of using authenticated app to GET an individual installation
  // https://developer.github.com/v3/apps/#find-repository-installation
  const { data } = await request("GET /repos/:owner/:repo/installation", {
    // TODO: parameterize
    owner: "rhinodavid",
    repo: "upswyng",
    headers: {
      authorization: `Bearer ${jwt}`,
      accept: "application/vnd.github.machine-man-preview+json",
    },
    mediaType: { previews: ["machine-man"] },
  });

  // contains the installation id necessary to authenticate as an installation
  const installationId = data.id;

  return { app: githubApp, installationId };
}

setupGithubApp(appId, privateKey)
  .then(async ({ app, installationId }) => {
    console.info("🐙 Successfully authenticated with GitHub");

    // try to create a blob
    const installationAccessToken = await app.getInstallationAccessToken({
      installationId,
    });

    const response = await request(
      endpoint("/repos/:owner/:repo/contents/:path", {
        headers: {
          authorization: `token ${installationAccessToken}`,
        },
        owner: "rhinodavid",
        repo: "upswyng",
        message: `Test commit ${new Date()}`,
        content: btoa(`My test commit\nDate: ${new Date()}`),
        branch: "test_branch", /// will this create a new branch
      })
    );
    console.log(JSON.stringify(response));
  })
  .catch(error => {
    console.info("👎 Failed to authenticate with GitHub:\n", error);
  });
