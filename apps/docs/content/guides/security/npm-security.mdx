---
id: 'npm-security'
title: 'Securing npm installs'
description: 'Consumer-side guide to hardening your npm installs of Supabase packages against supply-chain attacks.'
---

A practical guide for anyone installing Supabase packages from npm — the JavaScript client libraries (`@supabase/supabase-js` and friends), the `supabase` CLI, or any other dependency in your tree — on defending against supply-chain attacks. Most of it applies to any npm package, not just Supabase's.

<Admonition type="tip">

Looking to **report** a vulnerability in Supabase itself? See the [Supabase security policy](https://github.com/supabase/supabase-js/security) instead. This guide is about hardening your install of Supabase (and other) packages on your machines and in your CI.

</Admonition>

## Why this guide exists

The same attack pattern keeps recurring: a popular npm package is compromised, the new version executes attacker code on `npm install` via a lifecycle script or transitive dependency, the malware harvests credentials from the install host, and then self-propagates by republishing other packages the victim maintains.

The good news: most of the impact is preventable from the consumer side, regardless of what any one publisher does. This guide is the set of settings and habits we recommend you adopt.

## What to do today

1. **Commit your lockfile** and install with `--frozen-lockfile` (pnpm/yarn) or `npm ci` (npm) in CI.
2. **Quarantine new versions.** Set a minimum release age (≥ 7 days) so installs won't pick up a brand-new version while attackers are still in their detection window. npm, pnpm, yarn, and bun all support this natively now.
3. **Block exotic transitive dependencies.** Refuse `github:`, `git+`, and `file:` refs that didn't come from the npm registry.
4. **Verify provenance.** Run `npm audit signatures` after install. Supabase packages publish with [sigstore attestations](https://www.sigstore.dev/) (cryptographic proof tying each tarball to the workflow run, commit, and repo it was built from).
5. **Constrain lifecycle scripts.** Default-deny `postinstall` / `preinstall` / `prepare`; allow per-package.
6. **Pin a single source of truth for your package manager** (`packageManager` field in `package.json` with a sha512 hash).
7. **Have a rollback plan.** Know which packages, which versions, and which credentials to rotate if a compromise is announced upstream.

The rest of this document expands on each of these and covers the Edge Functions / Deno case separately.

## Pin your dependency versions

A committed lockfile is the floor, not the ceiling.

**Application repos**:

- Commit `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock`.
- In CI, install with `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --immutable` / `bun install --frozen-lockfile`. These fail if `package.json` and the lockfile disagree, which is what you want.
- Caret ranges (`^1.2.3`) in `package.json` are fine **if** you also have a lockfile and the rest of the guidance below — the lockfile is what actually gets installed.

**Pin transitive risk with overrides.** If you don't trust a particular transitive dep version, force a known-good version via:

```jsonc
// npm and pnpm
"overrides": {
  "some-dep": "1.2.3"
}

// yarn
"resolutions": {
  "some-dep": "1.2.3"
}
```

This is the lever to reach for when you see a CVE on a transitive you don't directly depend on.

### Beware `npx` / `pnpm dlx` / `bunx`

These commands fetch and run a package outside your project's lockfile and outside your minimum-age gate. `npx pkg@latest` is a direct fetch against the registry, and a fresh malicious version will be installed. Two practical mitigations:

- **Pin the version**: `npx pkg@1.2.3` instead of `npx pkg@latest`.
- **Move the tool into `devDependencies`** so it's covered by your lockfile and the rest of this guide, then invoke it through `npm exec` / `pnpm exec` / `yarn run`.

Treat any ad-hoc registry fetch the same way you'd treat `curl … | bash`.

## Quarantine new versions (minimum release age)

Most npm compromises are detected and remediated within hours. A short quarantine on freshly-published versions is the single highest-leverage setting.

### `pnpm` (recommended)

pnpm v11 turns this on by default (1440 minutes = 1 day). You can raise it. In `pnpm-workspace.yaml` at the repo root (pnpm 10+ reads config from this file with or without workspaces):

```yaml
minimumReleaseAge: 10080 # 7 days, in minutes
minimumReleaseAgeExclude:
  - '@your-org/*' # bypass for your own internal packages
```

Set `minimumReleaseAge: 0` only if you have a specific reason to opt out of the default.

#### `trustPolicy` (pnpm)

Independent of the age gate, pnpm's `trustPolicy: no-downgrade` refuses to install a version whose trust level (trusted publisher → provenance → none) has dropped relative to previous releases of the same package. That catches the case where an attacker can publish but can't replicate the original maintainer's OIDC binding:

```yaml
trustPolicy: no-downgrade
trustPolicyExclude:
  - 'some-package' # opt specific packages out if needed
trustPolicyIgnoreAfter: '180d' # ignore checks for packages older than 180 days
```

### `yarn` (berry / v4+)

In `.yarnrc.yml`:

```yaml
npmMinimalAgeGate: '7d'
npmPreapprovedPackages: # opt specific packages out of all package gates
  - '@your-org/*'
```

Versions newer than the gate are excluded from resolution. Yarn's docs also note this guards against the npm registry's 72-hour unpublish window — a package you just installed could vanish, breaking your build, if you don't wait it out.

Two related yarn settings worth knowing about while you're in `.yarnrc.yml`:

- **`enableScripts: false`** is the default in yarn — postinstall scripts from third-party packages don't run. Workspaces still run their own.
- **`enableHardenedMode: true`** makes yarn re-query remote registries to confirm that the lockfile content matches what the registry currently serves. Auto-on for GitHub PRs from public repos; worth turning on permanently if your threat model warrants slower installs.

### `npm`

Use the [`min-release-age`](https://docs.npmjs.com/cli/configuring-npm/config#min-release-age) config (relative, in days) or [`before`](https://docs.npmjs.com/cli/configuring-npm/config#before) (absolute date). Set in `.npmrc`:

```ini
min-release-age=7
```

Or per-command:

```bash
npm install --min-release-age=7
```

If `min-release-age` isn't available in your npm version yet, fall back to a private mirror or to a CI gate that calls `npm view <pkg>@<version> time.<version>` and rejects installs whose newest version was published in the last N days.

### Bun

Use the `--minimum-release-age` flag (seconds), or set it once in `bunfig.toml`:

```toml
[install]
minimumReleaseAge = 604800 # 7 days, in seconds
minimumReleaseAgeExcludes = ["@types/node", "typescript"] # trusted bypass
```

Or per-command:

```bash
bun add @supabase/supabase-js --minimum-release-age 604800
```

Bun's age gate only affects new resolutions — existing entries in `bun.lock` are unchanged. It also runs a stability check: if multiple versions were published close together just outside your gate, Bun extends the filter to skip those (likely unstable) versions and picks an older, more mature one. Exact-version requests (`pkg@1.1.1`) respect the gate but bypass the stability extension.

For Deno-based Edge Functions, see the [Edge Functions specifics](#edge-functions-specifics) section below.

## Verify package provenance

`@supabase/supabase-js`, `@supabase/auth-js`, `@supabase/postgrest-js`, `@supabase/realtime-js`, `@supabase/storage-js`, and `@supabase/functions-js` publish with [sigstore provenance attestations](https://docs.npmjs.com/generating-provenance-statements) via npm OIDC trusted publishing. The attestations cryptographically tie each published tarball to the workflow run, commit, and repository it was built from.

A valid Supabase attestation will always resolve to a repository under the [`supabase` GitHub organisation](https://github.com/supabase). If `npm audit signatures` reports a verified attestation pointing anywhere else for an `@supabase/*` package, treat that as a red flag.

To verify after install:

```bash
npm audit signatures
```

Sample output:

```text
audited 1 package in 0s
1 package has a verified registry signature
```

A failure here is a strong signal that either your registry mirror is tampered with or the tarball was modified after publish. Use a recent npm CLI (the version bundled with Node.js can lag); install the latest with `npm install -g npm@latest`.

See [Verifying provenance attestations](https://github.com/supabase/supabase-js#-verifying-provenance-attestations) in the `supabase-js` README for additional examples.

## Control lifecycle scripts

`preinstall`, `postinstall`, and `prepare` scripts are the single most common code-execution entry point in a compromised dep.

**pnpm**: declare an allowlist in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: false
  simple-git-hooks: true
```

Default-deny is the goal. Add packages only when you genuinely need their build to run.

**yarn**: `enableScripts: false` is the default — postinstall scripts from third-party packages don't run unless you opt in per package via `dependenciesMeta` in `package.json`. Workspaces still run their own scripts.

**npm / bun**: install with `--ignore-scripts` and only enable scripts for the packages that truly need them.

**The `@supabase/*` core packages run no install/postinstall scripts.** You can safely keep them on the deny list.

## Block exotic dependency references

A transitive dependency that resolves to a non-registry source — for example `optionalDependencies: { "some-helper": "github:attacker/repo#<sha>" }` — pulls code directly from a git object store or arbitrary URL, bypassing the npm registry's signing, provenance, and quarantine guarantees entirely. Block this class of ref:

**pnpm**: in `pnpm-workspace.yaml`:

```yaml
blockExoticSubdeps: true
```

**npm**: the `allow-git`, `allow-remote`, `allow-file`, and `allow-directory` settings each take `"all"` (default), `"none"`, or `"root"`. `"root"` means "only allow this kind of reference if it's declared in your own `package.json`, never as a transitive dep" — which is exactly the trust boundary you want:

```ini
allow-git=root
allow-remote=root
allow-file=root
allow-directory=root
```

**yarn**: use `approvedGitRepositories` to allowlist specific git sources. Anything not matching is rejected:

```yaml
approvedGitRepositories:
  - 'https://github.com/yarnpkg/*'
  - 'ssh://git@github.com/yarnpkg/*'
```

**bun**: no native equivalent today — inspect your `bun.lock` for non-registry refs.

## Pin your package manager

Drift between local dev and CI is a quiet source of risk. Pin the package manager itself with a sha512 hash:

```jsonc
// package.json
"packageManager": "pnpm@10.0.0+sha512.<hash>"
```

Corepack (bundled with modern Node) and `pnpm/action-setup@v6+` both read this field automatically. A compromised npm mirror serving a tampered pnpm binary fails the hash check instead of running.

## Prune unused dependencies

Every dependency you don't actually need is attack surface you don't actually need. Two cheap habits:

- Periodically run `npx depcheck` (or the equivalent for your stack) and remove dependencies that aren't imported anywhere.
- Look at your direct dependencies when a CVE lands. Is the dep doing something you could do in 20 lines yourself? Some of the most-exploited packages are tiny utilities that became transitive footguns.

This is the unglamorous half of supply-chain defence: fewer packages, fewer attackers' chances.

## CI / lockfile hygiene

- Run `--frozen-lockfile` / `npm ci` in every CI job. Never let CI silently regenerate the lockfile.
- Review lockfile diffs in PRs the same way you review code diffs. Unexpected new transitive dependencies or version jumps deserve a question.
- Configure Dependabot or Renovate to batch updates and respect the same min-age you set locally. Renovate's `minimumReleaseAge` option is the direct equivalent.
- Run `npm audit signatures` as a non-blocking CI step so a tampered tarball is caught early.

## Stay informed

Prevention is only half the job — you also need to find out when something has gone wrong upstream, ideally before the news goes wide.

- **Enable [Dependabot alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)** on every repository that has a lockfile. Free for both public and private repos. It checks your lockfile against the GitHub Advisory Database and pings you when a transitive becomes a known-vulnerable version.
- **Subscribe to the [GitHub Advisory Database](https://github.com/advisories)** RSS feed (filter by ecosystem: npm) for ambient awareness of new advisories — useful even for packages you don't depend on directly.
- **Run `npm audit` / `pnpm audit` on a schedule** as a _non-blocking_ CI job. Treat it as a notifier, not a gate (audit is noisy and a blocking gate trains people to ignore it).
- **Third-party scanners** — Socket, Snyk, Aikido, and similar services often spot compromises faster than the GHSA feed. We don't endorse a specific one; if your org already has a license, plug it in. If not, evaluate based on detection time on past incidents, not feature lists.
- **Watch the channels your peers watch.** During past compromises, the upstream GitHub issue and a handful of security-researcher accounts on social media were the canonical signal hours before formal advisories landed. There's no substitute for a few well-curated follows.

## Edge Functions specifics

If you're using `@supabase/supabase-js` (or any `npm:` specifier) from Deno in a Supabase Edge Function, you don't have the npm-side minimum-release-age gate available at the runtime layer. What you can do instead:

- **Pin to exact versions** in your import map / `deno.json` — avoid floating tags like `latest`.
- **Vendor critical dependencies** (`deno vendor`) and commit the vendored output. This freezes the dep at a known-good snapshot and removes the runtime fetch entirely.
- **Use `--lock` and `--lock-write`** in CI to fail any build that pulls in unexpected content.
- **Stay current on Deno** — newer versions are landing more supply-chain features (lockfile integrity, `npm:` provenance verification). Track the [Deno release notes](https://github.com/denoland/deno/releases).

Talk to the Supabase Functions team if your security posture depends on a feature only in a newer Deno.

## If you suspect you installed a compromised version

Move quickly. Order of operations:

1. **Treat the install host as potentially compromised.** Anything readable by the user that ran the install — env vars, files, secrets in memory — should be assumed stolen.
2. **Rotate credentials reachable from that host**: cloud provider keys (AWS, GCP, Azure), Kubernetes / Vault tokens, GitHub tokens, npm tokens, SSH keys, and any Supabase service-role keys or anon keys that touched the box.
3. **Wipe `node_modules`** and your package manager cache (`npm cache clean --force`, `pnpm store prune`, `yarn cache clean`).
4. **Pin to a known-good version** in `package.json` and reinstall against a fresh cache.
5. **Check `npm audit` and the [GitHub Advisory Database](https://github.com/advisories)** for the package.
6. **Report it**: file a GitHub Security Advisory on the upstream repo, and email `security@npmjs.com` if the version can still be installed.

## What Supabase does on its side

- **OIDC trusted publishing.** No long-lived `NPM_TOKEN` secret. Each publish is authenticated against npm using a short-lived OIDC token bound to the release workflow.
- **Provenance attestations.** Every release of `@supabase/supabase-js` and its sibling packages ships with a sigstore attestation tying the tarball to its source commit and workflow run. Verify with `npm audit signatures`.
- **No `postinstall` / `preinstall` scripts** in any of the six core packages (`auth-js`, `postgrest-js`, `realtime-js`, `storage-js`, `functions-js`, `supabase-js`). You can safely install with `--ignore-scripts`.
- **Fixed-version monorepo releases.** All packages release together with identical versions, so when you pin one, you pin them all.
- **Multi-step release approval via GitHub environments.** Stable publishes from `master` run inside a protected GitHub environment that requires explicit approval from a maintainer before the publish job can access npm OIDC credentials.

If something looks wrong with a published `@supabase/*` package, report it via the [Supabase security policy](https://github.com/supabase/supabase-js/security).

## References

- TanStack/router compromise postmortem: [TanStack/router#7383](https://github.com/TanStack/router/issues/7383), [GHSA-g7cv-rxg3-hmpx](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx).
- ["The Monsters in Your Build Cache — GitHub Actions Cache Poisoning"](https://adnanthekhan.com/2024/05/06/the-monsters-in-your-build-cache-github-actions-cache-poisoning/) (May 2024).
- GitHub Security Lab, ["Keeping your GitHub Actions and workflows secure: Preventing pwn requests"](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/) (Part 1 of a 4-part series, 2021–2025).
- npm trusted publishing: [docs.npmjs.com/trusted-publishers](https://docs.npmjs.com/trusted-publishers).
- npm provenance: [docs.npmjs.com/generating-provenance-statements](https://docs.npmjs.com/generating-provenance-statements).
- pnpm `minimumReleaseAge`, `blockExoticSubdeps`, `allowBuilds`: [pnpm.io/settings](https://pnpm.io/settings).
- Renovate `minimumReleaseAge`: [docs.renovatebot.com](https://docs.renovatebot.com/configuration-options/#minimumreleaseage).
- GitHub Advisory Database: [github.com/advisories](https://github.com/advisories).
