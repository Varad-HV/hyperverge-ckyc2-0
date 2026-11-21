# NIA CKYC 2.0 journey demo

A presentation site for New India Assurance that shows the customer journey and launches the real
HyperVerge Web SDK workflow (`nia_ckyc_individual_demo`).

## Set up (once)
1. `cp .env.example .env`
2. Open `.env` and set `APP_KEY=` (the HyperVerge app key for app `zz08tr`). `APP_ID` is already filled in.
   This is the only file that holds the key. It stays on the server and is never sent to the browser.
3. `npm start` and open http://localhost:8787 (changes to `.env` are picked up without a restart; refresh the page)

## Share a link
`./share.sh` starts the server and prints a public `https://….trycloudflare.com` link. It stays valid while the script runs.

## How it works
- `/api/token` calls HyperVerge's login API (`auth-ind.idv.hyperverge.co/login`) with the appId and appKey, binding the token to a fresh transactionId and the workflow.
- The page calls `HyperKYCModule.prefetch(appId, workflowId)` on load, well before launch.
- Scenarios pass the workflow's six inputs (`policyholderName`, `gender`, `dob`, `mobileNumber`, `email`, `panNumber`; `NA` when not provided).
- Optional `ACCESS_CODE` in `.env` puts a code gate in front of the live demo.

## GitHub Pages
The `docs/` folder is the static site, so it can be published with GitHub Pages (Settings, Pages, branch `main`, folder `/docs`).
On Pages there is no server, so there is no token endpoint: the page shows the guided walkthrough and a note that the live journey needs the full demo environment. The appKey is never part of the repo (`.env` is git-ignored).
