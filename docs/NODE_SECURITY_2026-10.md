# October 2026 Node.js security update

The repository previously selected Node 20 for Firebase Functions and every GitHub Actions application build. Node 20 is upstream EOL. Google lists its Functions runtime decommission date as 2026-10-30.

This change selects the supported Node 22 major for the existing first generation Functions. Application builds and local selectors use the security release 22.23.4. Dependency versions and integrity hashes are unchanged; only root engine metadata changes in the lockfiles.

- [Node.js October security advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Firebase runtime selection](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version)
- [Google runtime support schedule](https://docs.cloud.google.com/functions/docs/runtime-support#node.js)

## Evidence and validation

Validation ran on macOS arm64 using the official Node 22.23.4 binary after its SHA256 matched the published release checksum. Clean installs and the final build checks used an explicit environment allowlist with a temporary HOME/cache/TMPDIR and no inherited credentials.

| Check | Result |
| --- | --- |
| Root and Functions `npm ci` from existing lockfiles | Passed |
| Root `tsc --noEmit` and Functions `tsc` | Passed |
| Existing Vitest unit suite | 13 passed |
| Vite application build in local mode | Passed; existing chunk warnings remain |
| Functions load and unauthenticated callable smoke | 9 exports loaded; 6 callables rejected unauthenticated requests before DB/AI access |
| `npm run lint` | Unavailable: ESLint is not a declared dependency; command exits 127 |
| Existing Chromium E2E suite in local mode | 18 passed, 3 failed, 14 not run after the configured three failure limit |
| Existing production Hosting URL | HTTP 200 before deployment; this does not attest the Functions runtime |

The E2E failures were a guardian quick login that returned "user not found" and two notification tests that did not reach authenticated navigation. Application UI, services, and the test specifications were not changed. These failures have not been independently reproduced on the previous Node runtime, so no claim is made that the migration caused or resolved them. The run used the existing cached Chromium 153 executable through a temporary test configuration; it did not install another browser or contact production Firebase.

The first draft CI run confirmed Node 22.23.4 and successfully built Functions, but the repository-wide type check also includes Functions sources while that job installed only root dependencies. The type check job now installs both existing lockfiles, matching the successful local validation setup.

## Production verification remains pending

`functions/package.json` selects a managed major version. It cannot establish Google's deployed patch version. A single startup log now records `process.version` without logging requests or credentials. After an authorized redeployment through the existing release workflow, confirm that the deployed revision corresponds to this change and inspect a cold start runtime log for Node 22.23.4 or a newer fixed 22.x version.

Then check authenticated role access, principal callables, Firestore access, scheduled/auth triggers, and outbound AI/TLS requests using the existing authorized operational checks. None of these production calls were made during this change. No Firebase CLI or authenticated Google Cloud connection was available in the validation environment, and production release authority was not confirmed. No merge or deployment was performed.

The existing preview workflow now skips draft PRs, so a draft security PR can be reviewed without creating a Firebase Preview deployment. The main deployment gate is unchanged. Do not change the pricing plan, generate credentials, or roll back to an affected Node runtime to bypass a failed release check.
