# Studio Assistant Evals

We use [Braintrust](https://www.braintrust.dev/) to evaluate Assistant behaviors against a tracked dataset (offline evals) and against live traces (online evals).

## Offline Evals

Add offline eval test cases to `dataset.ts`. If needed, add new scorers (see below) for the specific dimension you wish to test. Expect to update and run offline evals when adding new Assistant behaviors

You may wish to run offline evals when:

- You updated the eval suite with a new test case or scorer
- You changed Assistant's behavior and want to check for improvements/regressions

### Running Offline Evals in CI

Add the `run-evals` label on a PR to the repo and Braintrust's GitHub Action will run evals and post a summary comment ([example](https://github.com/supabase/supabase/pull/44729)).

You can find detailed results in the "Experiments" tab of the "Assistant" project on Braintrust.

### Running Offline Evals in Local Dev

Within `apps/studio`

```bash
# To set up WASM files
pnpm evals:setup

# Run all evals and upload results to Braintrust
pnpm evals:upload

# Run all evals without uploading results
pnpm evals:run

# Run an upload single test case
pnpm braintrust eval evals/assistant.eval.ts --filter "input.prompt=How many projects"
```

Upload results when you want to inspect Experiments or Logs in the Braintrust dashboard or API. You can use developer tools like [Braintrust MCP](https://www.braintrust.dev/docs/integrations/developer-tools/mcp) or [`bt` CLI](https://www.braintrust.dev/docs/reference/cli/quickstart) to analyze results with an agent.

## Scorers

Scorers look at a `thread` or task `output` and assign a score deterministically or via LLM-as-a-judge. Optionally they can consider `expected` values.

Define scorers in `scorer.ts` and include them in `assistant.eval.ts` to run them in offline evals.

### Updating Online Scorers

Online scorers run as serverless functions on Braintrust infrastructure. They're deployed from the `scorer-online.ts` script. Since these scoring against production traces, they can't rely on ground truth `expected` values. Structure scoring logic and LLM prompts accordingly. Not every scorer needs to be an online scorer.

To opt-in to online scoring, add the scorer to `scorer-online-manifest.json` and add a corresponding handler in `scorer-online.ts`

### Testing & Deploying Online Scorers

Add the `preview-scorers` label to a PR to deploy branch-prefixed scorers to the "Assistant (Staging Scorers)" Braintrust project ([example](https://github.com/supabase/supabase/pull/45654#issuecomment-4398433047)). From that project dashboard, you can manually test the scorer against a trace from any project.

After merge to `master`, preview scorers automatically clean up and deploy to the production in the "Assistant" Braintrust project. Update the "Online Scoring" automation in the Logs page to include the new scorer function.
