---
title: 'Protecting your Supabase projects from npm supply chain attacks'
description: 'How Supabase is responding to npm supply chain attacks and practical steps you should take today to reduce your risk.'
author: katerina_skroumpelou
date: '2026-05-26'
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=platform&layout=icon-text&copy=Protecting+projects+from%0A%5Bnpm+supply+chain+attacks%5D&icon=supabase.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=ruler&layout=icon-only&copy=Protecting+projects+from%0A%5Bnpm+supply+chain+attacks%5D&icon=supabase.svg'
categories:
  - security
tags:
  - security
  - npm
  - supply-chain
  - javascript
toc_depth: 3
---

There has been a growing trend of supply chain attacks on Node Package Manager (NPM). In addition, we have seen other creative attacks, including a typosquat package named `supabase-javascript` that appeared on npm, copying our name to phish developers. We reported it. npm took it down a few hours later, long enough that the package picked up real downloads.

If you build on Supabase, this matters to you. Edge Functions pull from npm. The Supabase CLI is on npm. `supabase-js`, `@supabase/ssr`, and `@supabase/server` are all on npm. Any of these is a credential leak waiting for the wrong update to land.

This post lays out what we are doing about it and what you should do today.

## What we are doing about it at Supabase

We kicked off a [coordinated response](https://supabase.com/docs/guides/security/npm-security#what-supabase-does-on-its-side) across the company. The work in flight:

- **Publishing a [canonical security guide](https://supabase.com/docs/guides/security/npm-security) in our docs.** A single, agent-readable page that tells you exactly what to do.
- **Hardening our own GitHub Actions.** Our security team finished a pass on `pull_request_target` usage across the Supabase org months ago and is close to enforcing pinned action SHAs across every repo.
- **Adding security notes to secret-handling APIs.** TSDoc and JSDoc on functions like `createClient` so editor hovers warn when you are working with sensitive credentials.
- **Comms across every channel.** Our goal is to educate as many people as we can, whether or not they are Supabase customers.

## How npm supply chain attacks actually happen

Supply chain attacks share a shape. The attacker does not break into your computer. They get you to invite their code in, and they do that by getting their code into a package you already trust. The recipes vary, but the three most common patterns are these:

- **Maintainer compromise.** An attacker steals an npm publish token or phishes a maintainer, then publishes a new version of a popular package with malicious code added. The next time you run `npm install` against that range, you are running their code.
- **Typosquatting.** An attacker registers a package name a few letters away from a real one, like `supabase-javascript` instead of `@supabase/supabase-js`. They wait for a developer or, increasingly, an AI coding agent to mistype the name. AI agents hallucinate package names regularly, and that is now a primary attack vector against teams that vibe-code their dependencies.
- **Build pipeline compromise.** This is what hit TanStack. An attacker found a vulnerable GitHub Actions workflow, poisoned the build cache from a fork PR, and waited for the next legitimate release run to pick up the poisoned cache and publish their code under the real maintainer's identity. No stolen tokens. No compromised laptops. The attacker rode the official release train.

Once the malicious code lands on disk in your `node_modules`, npm's lifecycle scripts run it. By the time `npm install` returns, the attacker has already read your environment variables, your AWS instance metadata, your kubeconfig, your `.npmrc` token, your `.git-credentials`, and your SSH private keys. The TanStack payload exfiltrated through the Session messenger network, which is end-to-end encrypted and has no fixed command-and-control address. You cannot block it at the firewall.

[The TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem) describes the full chain and is worth reading if you maintain a public open source project. The short version: every link in the chain (a `pull_request_target` workflow, an unsecured Actions cache, a long-lived OIDC publish token) was a known issue with public mitigations. The attack worked because nobody had connected the dots in advance.

## Other things you should do today

Most of what follows takes minutes. The goal is layered defense: no single mitigation stops every attack, but together they raise the cost enough that attackers go bother someone else.

### Upgrade to pnpm 11 (or the npm v11 equivalent)

pnpm 11 sets `minimumReleaseAge` to 24 hours by default, blocks exotic subdependencies by default, and ships a new Allow Builds model that controls which dependencies are permitted to run install scripts. **If your AI coding agent picked pnpm 10.x for you, fix that.** Tell it to use pnpm 11.

Then set `minimumReleaseAge` higher than the default. **Three to seven days is a reasonable starting point** for most projects. Most malicious npm packages are caught and pulled within twenty-four to forty-eight hours, so a three-day window catches the long tail of detections without throttling legitimate updates too much. Configure it in your project's `pnpm-workspace.yaml` or `.npmrc`:

```yaml
minimumReleaseAge: 4320 # minutes, equals 3 days
```

### Pin versions, especially for security-sensitive dependencies

The `^` and `~` ranges in your `package.json` are a polite way of telling npm "trust me, take the next minor or patch version." Supply chain attacks exploit exactly that trust. **Pin exact versions for anything that touches authentication, secrets, networking, or user data.** Use `^` only where you actively want updates and have a process to vet them.

### Commit your lockfile and review changes to it

A lockfile records exactly which version of which package, with which hash, you installed. If an attacker republishes a tarball under the same version number, the hash mismatch fails the install. Commit `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` to your repo. **Treat lockfile diffs as code review surface, not noise.** A pull request that bumps fifty transitive dependencies for no obvious reason deserves a careful read before it merges.

### Disable npm install scripts where you can

Most supply chain payloads run through `preinstall`, `install`, or `postinstall` lifecycle scripts. If your project does not need them, turn them off globally:

```bash
npm config set ignore-scripts true
```

Or scope it to the project via `.npmrc`:

```txt
ignore-scripts=true
```

The trade-off is that some packages with native code (`bcrypt`, `sharp`, and similar) will not build without scripts. Use pnpm's Allow Builds model to allowlist the specific packages you actually need rather than allowing every package on the registry to run code at install time.

### Verify package names every single time you install

Typosquats target the moment of carelessness. Before you `pnpm add` anything, especially anything an AI agent suggested, check that:

- **The scope is correct.** Official Supabase packages live under `@supabase/`. A package named `supabase-javascript` or `supabase-server` without the scope is not ours and never has been.
- **The maintainer is the expected one.** The npm page lists current maintainers; a brand-new maintainer on a long-established package is a signal worth a closer look.
- **The download counts and the linked GitHub repo match what you expect** for a real, established package.

### Pin your GitHub Actions to commit SHAs, not tags

If you maintain a public repo, this is the single biggest change you can make. A tag like `@v5` is a moving target. The maintainer of that action (or an attacker who compromised that maintainer) can republish the tag with new code, and your workflow will pick it up on the next run. Pin to the full commit SHA instead:

```yaml
- uses: actions/checkout@1f9a0c22da41e6ebfa534300ef656b67ce0c5b94 # v6.0.2
```

Renovate and Dependabot both understand this syntax and will update the comment when a new release is published, so you still get visibility without giving up safety.

### Avoid `pull_request_target` with code checkout

If your workflow uses `pull_request_target` and then checks out code from the PR, you are running attacker-controlled code in a context that has access to your repo's secrets and cache. **This is the exact pattern that compromised TanStack.** Use `pull_request` for anything that touches PR code. Reserve `pull_request_target` for trusted, no-checkout operations like labeling or commenting on the PR.

### Rotate credentials if you think you were exposed

If you ran `npm install` on a day when a package you depend on turned out to be compromised, treat the install host as potentially compromised too. Rotate everything reachable from that machine: AWS, GCP, Kubernetes, Vault, GitHub, npm, SSH, and any Supabase service-role keys. Audit your service-role key usage in the Supabase dashboard for access patterns you do not recognize. **It is an annoying afternoon. It is not as annoying as a customer breach.**

### Consider a scanner as a second line of defense

Tools like [Socket.dev](https://socket.dev), npq, and Snyk monitor the npm registry and flag suspicious package behavior in real time. None of them are a silver bullet, and none of them substitute for the practices above. They are a useful second line of defense for teams that already have the basics in place.

## Closing thought

This kind of attack will keep happening. The cost of pulling one off keeps dropping; the payoff (credentials to dozens of production systems in a single shot) keeps rising. The good news is that the defenses are well understood, cheap to implement, and effective when stacked. Pin your versions. Wait for the dust to settle on new releases. Lock your CI down. Verify what you install. Tell your AI agents to do the same.

If you have suggestions, requests, or your own war stories about how you handle this on your team, find me on Discord or on Twitter.

## Prompt for your coding agent

Paste this into Claude Code, Codex, Cursor, or whatever agent you use. Read every change before you accept it. Do not skim.

```
Audit this repo for npm supply-chain hygiene. Apply the changes below and report what you did. Do not push, open PRs, install new dependencies, or rotate credentials without explicit approval.

Package manager:

- Upgrade to pnpm 11+ (or the latest yarn / npm / bun) if older.
- Set a 7-day quarantine on new versions for the package manager in use:
  - pnpm: `minimumReleaseAge: 10080` in `pnpm-workspace.yaml`.
  - npm: `min-release-age=7` in `.npmrc`.
  - yarn (berry): `npmMinimalAgeGate: '7d'` in `.yarnrc.yml`.
  - bun: `minimumReleaseAge = 604800` under `[install]` in `bunfig.toml`.
- Block lifecycle scripts by default. pnpm: declare an explicit `allowBuilds` list in `pnpm-workspace.yaml`. npm/bun: set `ignore-scripts=true`. yarn defaults to `enableScripts: false` — confirm it is not overridden.
- Block non-registry transitive refs. pnpm: `blockExoticSubdeps: true`. npm: set `allow-git=root`, `allow-remote=root`, `allow-file=root`, `allow-directory=root` in `.npmrc`. yarn: use `approvedGitRepositories` as an explicit allowlist.
- Pin the package manager itself: set `packageManager` in `package.json` to an exact version plus sha512 hash (e.g. `pnpm@10.4.1+sha512.<hash>`).

Lockfile and dependencies:

- Confirm `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` is committed (not gitignored). CI installs must use `--frozen-lockfile` (pnpm/yarn) or `npm ci`. Flag any job that runs a non-frozen install.
- For dependencies handling auth, secrets, networking, crypto, or user data, replace `^`/`~` ranges with exact versions. List what you changed.
- Verify every Supabase import uses the exact `@supabase/` scope. Flag unscoped lookalikes (`supabase-js`, `supabase-javascript`, etc.) as possible typosquats.

GitHub Actions (if present):

- Repin every third-party `uses:` reference to a 40-character commit SHA, with the original tag as a trailing comment.
- Flag every workflow using `pull_request_target` that checks out PR code or runs PR-controlled build steps. Propose a `pull_request` rewrite. Do not silently change trigger types.
- Add a non-blocking `npm audit signatures` step to install workflows.

Flag for human (do not auto-enable):

- Dependabot alerts and secret scanning, if disabled.

Report:

- One line per file changed, with the reason.
- A separate list of items flagged for human review rather than automatically changed.
```
