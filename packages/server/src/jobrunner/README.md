# Jobrunner

**Jobrunner is a special `upswyngbot` skill which allows it to execute one-off scripts in production**
**(as well as other environments)**

## Design

> See [Issue #389](https://github.com/CodeForBoulder/upswyng/issues/389) for motivation

### Overview

Suppose an engineer needs to execute a database migration, like changing the key `resourceId` to
`providerId` because of an edict from the product side. They could write a Node script on their local
machine, authenticate with production credentials, and execute the task that way. This has obvious drawbacks
with security and system reliability which grow more acute as the project expands.

To solve these problems, **Jobrunner** implements this basic flow which includes 3 worker jobs:

1. An engineer writes a script in TypeScript to accomplish the desired task (we could expand this to bash scripts)
2. The engineer submits the script in a Pull Request and it's reviewed like any other code change to the repository
3. The Pull Request is approved and the code is merged to `master`
4. UpSwyng server is notified of a new code change via a GitHub integration
5. UpSwyng server examines the commit to see if there is a new script in the designated directory. If there is, it creates a worker job to process the script.
6. The PROCESS job (Job #1) entails the worker querying GitHub to fetch the commited source file. Once it has the source, the worker uses Rollup to transpile the file to JavaScript (similar to how the server/worker get built themselves).
7. The worker completes Job #1 by creating Job #2, whose input includes the transpiled Javascript
8. Job #2 is the EXECUTE step. The worker executes the script using Node. It retains the `stdout` and `stderr` outputs of the execution, as well as metadata about the execution like start/end times and process exit code. These, along with the transpiled Javascript, are passed to Job #3.
9. Job #3 is CLEANUP step. The worker removes the original source code from the repository and creates a log of the execution which includes the Javascript executed and the data generated during the EXECUTE step. The worker communicates with the GithHub integration and commits the change to the repository.

### Goods

- Production credentials do not need be shared outside the production environment
- Standard code review process is applied to code being executed in production
- A record of the entire process is available
- A discreet sequence of worker jobs provides retry points in the case of a failure. e.g.: If GitHub is down and Job #1 fails, it can be retried via the `upswyngbot` dashboard without having to submit a new Pull Request with the script for a second time.
- It's easier for engineers less familiar with the UpSwyng infrastructure to run tasks in production. Write the script and get a Pull Request merged and the system handles the rest.
- Infrastructure can be extended to run bash scripts or even scripts in other languages if the need arises

### Others

- It's complex. While it's easier to get a script executed, it's one more piece of an increasingly complicated system which creates a challenge for newcomers. _Mitigation:_ documentation and tests.
- Testing a script one would like to create becomes a bit harder, since `upswyngbot` handles most of the complexity. _Mitigation:_ documentation and a script to transpile source code exactly like the worker would so it can be executed in a development environment.
- More credentials. _Mitigation:_ https://github.com/CodeForBoulder/upswyng/issues/271.
- No unit testing of scripts pre-execution by the infrastructure. _Mitigation:_ ensure that unit tests are conducted in CI before the commit makes it to `master`.
- Production dependencies at the time of script execution may _not_ match the dependencies of the CI environment. Suppose the Pull Request to add a script includes the script **with** an addition to the `package.json` dependencies. The Pull Request lands in `master` and the GithHub webhook fires. The worker grabs the new source code, builds it, and executes it. Meanwhile, Heroku has also been notified of the new code, but it's still building new bundles and the new dependency has not been installed. This causes the script to fail. _Mitigation:_ require Pull Requests which contain a new Jobrunner script to **only** contain new Jobrunner scripts. If a dependency needs to be added, require the modification to `package.json` to be done in a previous Pull Request.
- If the script fails in production, things get very messy. _Mitigation:_ robust logging of what has happened; a "break glass" capability to go back to the "old-school" way of authenticating in production for the time being.