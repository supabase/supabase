# Contributing

### Install deps

- docker
- `npm install`

### Start services

1. Run `docker compose up` in `/test/db`
2. Run the tests: `npm run test:run`
3. Make changes in code (`/src`) and tests (`/test/lib` and `/test/server`)
4. Run the tests again: `npm run test:run`
5. Commit + PR

### Canary Deployments

For testing your changes when they impact other things (like type generation and postgrest-js), you can deploy a canary version of postgres-meta:

1. **Create a Pull Request** targeting the `master` branch
2. **Add the `deploy-canary` label** to your PR
3. **Wait for the canary build** - GitHub Actions will automatically build and push a canary Docker image
4. **Use the canary image** - The bot will comment on your PR with the exact image tag and usage instructions

The canary image will be tagged as:

- `supabase/postgres-meta:canary-pr-{PR_NUMBER}-{COMMIT_SHA}`
- `supabase/postgres-meta:canary-pr-{PR_NUMBER}`

Example usage:

```bash
docker pull supabase/postgres-meta:canary-pr-123-abc1234
echo "canary-pr-123-abc1234" > supabase/.temp/pgmeta-version
```

**Note:** Only maintainers can add the `deploy-canary` label for security reasons. The canary deployment requires access to production Docker registries.
