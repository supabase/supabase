# Region availability gating in Studio — what exists, and what a free-plan `sa-east-1` gate would cost

Exploration only. No code changed. Written 2026-09-16 against `kemal/depr-684-options-to-mark-regions-unavailable-or-paid` (base `4432a8beb4`).

---

## TL;DR

You were right that something already exists, and it's better than you'd hope: **the create-project region picker already renders a per-region status coming off the platform API, already disables the option, already shows an "Unavailable" pill with a tooltip.** The rendering boundary you need is built.

What it can't do is be driven by you. The status comes from `GET /platform/projects/available-regions`, so flipping it needs a platform change, and it has no notion of plan.

There is also a second, unrelated mechanism — a ConfigCat JSON-string flag (`defaultRegionRestrictedPool`) that narrows which region the *geolocated default* may pick. It's the precedent for the flag shape you want, but it only runs on the `AWS_NIMBUS` code path, so in production today it does effectively nothing.

Recommendation: **extend, don't parallel.** One new ConfigCat text flag, one new utils file, ~30 changed lines in `RegionSelector.tsx`. No `shared-data` change (that would leak into docs and www), no `api-types` change, no platform dependency. Estimated ~240 lines total, ~90 of which are tests.

---

## 1. Every existing "this region is not selectable" mechanism

### A. Platform-driven per-region `status` — the one you spotted

| | |
|---|---|
| **Defined** | `packages/api-types/types/platform.d.ts:12173` (`RegionsInfo_Output`), fetched by `apps/studio/data/organizations/organization-available-regions-query.ts` |
| **Shape** | Per-region **optional string enum** on each item of `all.specific[]`: `{ code, name, provider, type: 'specific', status?: 'capacity' \| 'other' }`. Not a flat list, not a boolean. |
| **Source** | Platform API, `GET /platform/projects/available-regions?cloud_provider=&organization_slug=&desired_instance_size=` |
| **Affects** | Region **stays in the list**, rendered `disabled`, plus a `Badge variant="warning"` reading "Unavailable" with a tooltip — but only when `status === 'capacity'` |
| **Plan aware** | Not in Studio. `organization_slug` *is* sent to the endpoint, so the platform could in principle vary it by plan — Studio does nothing with plan either way. |
| **Currently marked** | Nothing in this repo. Entirely server-driven; no fixture or constant marks any region. |

Render site — `apps/studio/components/interfaces/ProjectCreation/RegionSelector.tsx:301-343`:

```tsx
disabled={value.status !== undefined}                        // :310
className={cn(..., value.status !== undefined && 'pointer-events-auto!')}  // :308 — keeps the tooltip alive on a disabled item
...
{value.status !== undefined && value.status === 'capacity' && (   // :328
  <Tooltip>...<Badge variant="warning">Unavailable</Badge>...
    <TooltipContent>Temporarily unavailable due to this region being at capacity.</TooltipContent>  // :336
```

Two things worth knowing:

- **`status === 'other'` disables the option with no badge and no explanation.** Latent copy bug; see open question 3.
- `recommendations.specific[]` carries `status` too, and Studio ignores it entirely.
- `all.smartGroup[]` has **no** `status` field. More on that below — it's the biggest hole in the client-side approach.

**Caching.** The same query is called from two places with different options: `RegionSelector.tsx:101` (`staleTime: 5 * 60_000`) and `ProjectCreationForm.tsx:264` (all `refetchOn*: false`). Same cache key, so whichever mounts first wins. Expect up to ~5 minutes of stale region state per session.

**Git history.** Built for exactly the situation you're in:

- `a77d40e43b` — *feat(replication): Update the API calls for replication endpoints (#36866)* — the `status?: 'capacity' | 'other'` field first lands in the generated types.
- `1174981650` / `be89cf02b6` — *[FE-1938] feat: show region capacity issues (#39611)*, Alaister, 2025-10-17 — the Studio render. +36/-8 in `RegionSelector.tsx` alone.
- `91645ade09` — *feat(region selector): get region status by desired size (#39631)* — adds `desired_instance_size` so status is per-region-per-compute-size.

So: a previous AWS capacity incident, not a launch gate.

**Consumed outside Studio?** No. `RegionsInfo_Output` lives in `packages/api-types`, which `apps/docs`, `apps/www`, `apps/ui-library`, `packages/common`, `packages/ui-patterns` and `e2e/studio` all depend on — but nothing outside Studio reads the available-regions endpoint. Safe.

### B. `defaultRegionRestrictedPool` — an existing ConfigCat region flag

| | |
|---|---|
| **Defined** | `apps/studio/data/misc/get-default-region-query.ts:86-88` |
| **Shape** | ConfigCat **string** flag holding JSON: an array of `AWS_REGIONS` **keys** (`["EAST_US", "CENTRAL_EU"]`), not region codes. Parsed with `tryParseJson`. |
| **Source** | ConfigCat. Runtime togglable, no deploy. |
| **Affects** | Only which region the **geolocated "nearest region" default** may pick (`getDefaultRegionCandidateKeys`). Never filters the list, never disables an option, never renders anything. |
| **Plan aware** | No. Purely global. |
| **Currently set to** | Unknown from code — it's a ConfigCat value. |

Two important properties:

1. It **self-neuters**: `getDefaultRegionCandidateKeys` falls back to the full provider set if the pool would leave zero candidates.
2. It is **unreachable on supabase.com.** `useDefaultRegionQuery` is only `enabled` when `!smartRegionEnabled`, and `smartRegionEnabled = cloudProvider !== 'AWS_NIMBUS'` (`RegionSelector.tsx:86`, `ProjectCreationForm.tsx:198`). On normal AWS the default comes from `availableRegionsData.recommendations.smartGroup` instead — and `AWS_NIMBUS` is not even selectable: the live `apps/studio/hooks/custom-content/custom-content.json` sets `"infra:cloud_providers": ["AWS", "AWS_K8S", "FLY"]`, which `CloudProviderSelector.tsx:60` filters the provider list against. So `cloudProvider` can never be `AWS_NIMBUS` in the default build, and this flag is never read.

History: `ac670e230e` — *Configure restricted region pool from configcat (#36105)*, Joshen, 2025-06-03.

This is the shape precedent to copy. It is not the lever to reuse.

### C. Build-time provider region allowlist

`getAvailableRegions(cloudProvider, environment)` — `ProjectCreation.utils.ts:11-33`. `AWS`/`AWS_K8S` → all of `AWS_REGIONS`; `AWS_NIMBUS` → exactly one region (`SOUTHEAST_ASIA` non-prod, `EAST_US` prod). **Filters the list entirely.** Build-time constant keyed on cloud provider + `NEXT_PUBLIC_ENVIRONMENT`. Not plan aware.

Note the interaction: when `smartRegionEnabled` (the normal AWS case), `RegionSelector.tsx:129` uses the API list and this function's output is discarded — it only feeds the Nimbus path and `resolveDefaultDbRegion`.

### D. High-availability region lock — the closest UX precedent

`getHighAvailabilityRegionCode()` + `filterHighAvailabilityRegions()` — `ProjectCreation.utils.ts:84-108`. prod/staging → `us-east-1`, local → `eu-central-1`, otherwise unrestricted.

This is the only existing mechanism that does the full trio:

1. **Filters** the list (`RegionSelector.tsx:130`),
2. **Explains** inline — a `text-warning` line in the field description (`RegionSelector.tsx:208-212`),
3. **Guards on submit** — `toast.error` at `ProjectCreationForm.tsx:468-472`.

Build-time, env-var keyed, not plan aware. Worth reading before you write yours.

### E. Incident overlay — not an availability gate

`useIncidentStatusQuery` + `incident.cache.affected_regions`, matched against the **selected** region including smart-group prefix matching (`SMART_REGION_PREFIXES`, `RegionSelector.tsx:54-62`). Renders an `Admonition` **under** the field (`:350-368`). Never disables anything.

This is the pattern to mirror for a "selectable but explained" state — see gap analysis row 5.

Related: `components/layouts/AppLayout/StatusPageBanner.utils.ts` does region-restricted incident banners at the app level.

### Adjacent constants (not gates, but region data)

- `apps/studio/lib/constants/infrastructure.ts` — `AWS_REGIONS_DEFAULT` (`ap-southeast-1` non-prod / `us-east-2` prod), `PROVIDERS[*].regions`, `PROVIDERS[*].default_region`.
- `InstanceConfiguration.constants.ts:98` — `AVAILABLE_REPLICA_REGIONS`, derived from `AWS_REGIONS` filtered to those with coordinates. Read replicas only.
- `PipelineRegionField.tsx` — `PIPELINE_REGION`, a fixed display-only constant.

### Shared-package blast radius — your hard constraint

`packages/shared-data/regions.ts` exports `AWS_REGIONS`, `AWS_REGIONS_KEYS`, `Region`, `CloudProvider`, `SMART_REGION_TO_EXACT_REGION_MAP`.

Consumers (whole repo, verified):

| Consumer | File | Renders |
|---|---|---|
| `apps/studio` | ~13 files | pickers, infra map, replica UI |
| `apps/docs` | `components/RegionsList.tsx` | the region table in `guides/platform/regions.mdx` |
| `apps/www` | `components/Regions/Regions.constants.ts` | the public regions page + map |

Nothing else. The management API and the MCP server are not in this repo and do not import `shared-data`.

**Conclusion: do not put availability state on `AWS_REGIONS`.** Adding a per-region property there would silently change the public docs region table and the marketing regions map, and both are world-readable surfaces where "unavailable" means something very different.

---

## 2. Region selection call sites

### The create-project picker

```
pages/new/[slug].tsx                                  (routes/new/$slug.tsx is a thin wrapper)
└─ ProjectCreationForm                                components/interfaces/ProjectCreation/ProjectCreationForm.tsx
   ├─ useOrganizationAvailableRegionsQuery            :264-278   ← same query, for default + HA resolution
   ├─ useDefaultRegionQuery                           :250-262   ← Nimbus-only geolocation default
   ├─ resolveDefaultDbRegion → setValue('dbRegion')   :292, :585-589
   └─ <RegionSelector form instanceSize />            :746
      └─ useOrganizationAvailableRegionsQuery         RegionSelector.tsx:96-104
         → allRegions = data.all.specific             :107
         → unfilteredRegionOptions                    :129
         → filterHighAvailabilityRegions              :130
         → regionOptions.map(...)                     :301  ← value.status read here
```

**Where unavailability data enters the tree: `RegionSelector.tsx:107`, and it is read exactly once, at `:301`.** That single `.map` callback has the whole per-region object in hand. That's the injection point.

### Every other dashboard place that provisions compute

| Surface | File | Region picker | Respects `status`? |
|---|---|---|---|
| New project (`/new/[slug]`) | `ProjectCreation/ProjectCreationForm.tsx:746` | shared `RegionSelector` | **Yes** |
| Vercel deploy-button new project | `pages/integrations/vercel/[slug]/deploy-button/new-project.tsx:126` | **same** `ProjectCreationForm` | **Yes** — gated for free |
| New org → project | `Organization/NewOrg/NewOrgForm.tsx` | **none** — org form has no region field; redirects to `/new/${slug}?projectName=…` (`:326`) | n/a |
| Read replicas | `Settings/Infrastructure/ReadReplicas/ReadReplicaForm/index.tsx` | own `<Select>` over `AVAILABLE_REPLICA_REGIONS` | **No** — never calls available-regions |
| Restore / clone to new project | `Database/Backups/RestoreToNewProject/CreateNewProjectDialog.tsx` | **none** — clone inherits the source project's region | **No — bypasses any client gate** |
| Branch creation | `BranchManagement/CreateBranchModal.tsx` | none (inherits parent) | n/a |
| Replication pipelines | `Database/Replication/…/PipelineRegionField.tsx` | display-only fixed constant | n/a |
| Vector / analytics buckets | — | no region picker | n/a |
| Project resume | `Project/ResumeProjectButton.tsx` | none — re-provisions in existing region | **No** |

Good news: only **one** picker component exists for project creation, and both flows that use it get gated together.

### Default / nearest-region auto-selection

`resolveDefaultDbRegion` (`ProjectCreation.utils.ts:50-72`), applied at `ProjectCreationForm.tsx:585-589` behind `!isDbRegionDirty`. Priority order:

1. HA-restricted region name (if HA is on and an HA region code exists)
2. **`availableRegionsData.recommendations.smartGroup.name`** — when `smartRegionEnabled`, i.e. all normal AWS traffic
3. `autoDefaultRegion` — the geolocated pick (`getDefaultRegionOption`, Cloudflare `cdn-cgi/trace` → `COUNTRY_LAT_LON` → nearest of `AWS_REGIONS_COORDINATES`), Nimbus only
4. `PROVIDERS[p].default_region.displayName` — `us-east-2` in prod

**What happens if the auto-selected region is marked unavailable? Nothing checks.** Three separate places ignore `status`:

- `resolveDefaultDbRegion` never sees it.
- `getDefaultRegionOption` only knows `AWS_REGIONS_COORDINATES`; it has no access to the API response at all.
- `recommendations.specific[]` carries `status` and is never read.

In practice this is currently harmless on AWS because step 2 wins and returns a **smart group** name ("Americas"), never a specific region code. But if you ever flip a region to selectable-with-a-pill, or if the Nimbus path widens, the form will happily sit on a restricted option.

One more subtlety: `RegionSelector.tsx:149-165` keeps a `lastValidRegionRef` and restores the last region that was present in `allSelectableRegions` whenever RHF drops the value. Because disabled regions **stay in the list**, a restricted region still counts as "available" to that effect and will be restored rather than cleared. If you ever filter rather than disable, re-read that effect.

And `ProjectCreationForm.tsx:591-595` resets `dbRegion` to `fixedDefaultRegion` when the regions fetch errors.

### The smart-group hole

`all.smartGroup[]` has no `status` field, and `sa-east-1` sits inside the `americas` group (`SMART_REGION_PREFIXES` maps `americas → ['us-', 'ca-', 'sa-']`). A free user who picks **"Americas"** — which is the *default* on AWS — submits `region_selection: { code: 'americas', type: 'smartGroup' }` and the platform picks the physical region. **A client-side gate on the specific list does not stop that.** See open question 2; this may be the single most important thing to confirm before shipping.

---

## 3. Gap analysis

| # | Requirement | What exists | Verdict |
|---|---|---|---|
| 1 | Three states: available / unavailable / paid-only | The wire format is **already a string enum** (`'capacity' \| 'other'`), not a boolean. Studio boolean-ifies it (`status !== undefined`). Widening the client-side union is a type change plus one render branch. | **Small extension** client-side. (Adding a third value to the *platform* enum would need the platform team — avoid.) |
| 2 | Runtime togglable, no deploy | Platform `status`: runtime, but server-owned. `defaultRegionRestrictedPool`: ConfigCat, runtime — wrong lever, and dead on the AWS path. Mechanisms C and D are build-time constants. | **Small extension** — add your own ConfigCat flag alongside, mirroring `defaultRegionRestrictedPool`'s shape. |
| 3 | Plan-tier aware | Nothing region-side. But `isFreePlan` is already computed one component up (`ProjectCreationForm.tsx:121`) and `plan` is already a ConfigCat custom attribute (`_app.tsx:109`). | **Small extension** — one prop. |
| 4 | Copy differs per state, trivially swappable | One hardcoded string at `RegionSelector.tsx:336`. `'other'` renders nothing at all. | **Small extension** — lift to a `Record<RegionRestriction, {badge, tooltip}>` map in a utils file. One-line swap for product. |
| 5 | Keep a region **selectable**, show a pill + notice, error on submit | **Already supported.** Restricted regions are not filtered out — they stay in the list and are only `disabled`. Flipping `disabled` off is one boolean. The "explanatory notice under the field" pattern already exists two blocks down (`affectingIncidents` Admonition, `:350-368`), and the submit-time guard pattern exists at `ProjectCreationForm.tsx:468`. | **Already supported** — no refactor debt. |
| 6 | Option-rendering boundary accepts per-region status | Yes. `regionOptions.map((value) => …)` at `:301` has the full per-region object. Nothing upstream filters *specific* regions except the HA lock and the provider allowlist, neither of which touches your case. | **Already supported** |

Nothing in this list is "needs replacing." The one genuine hole is smart groups (§2), and that is a platform question, not a refactor.

---

## 4. ConfigCat wiring

**Provider.** `FeatureFlagProvider` — `packages/common/feature-flags.tsx:76`. Mounted in both runtimes via a Studio wrapper: `pages/_app.tsx:179` and `routes/__root.tsx:372`, both `enabled={IS_PLATFORM}`.

**Client.** `packages/common/configcat.ts`. `configcat-js`, `PollingMode.AutoPoll`, `pollIntervalSeconds: 420` (7 min). Tries `NEXT_PUBLIC_CONFIGCAT_PROXY_URL` first, falls back to `NEXT_PUBLIC_CONFIGCAT_SDK_KEY`, returns `undefined` if neither works.

**Reading flags.** `useFlag<T>(name: string)` from `'common'` (`feature-flags.tsx:274`). **There is no key union and no key list** — the name is a bare string. Adding a flag requires **zero** code change to any registry. Caveat: `useFlag` `console.error`s when the key is absent from a non-empty store, so create the flag in ConfigCat before the code ships.

(`usePHFlag` in `apps/studio/hooks/ui/useFlag.ts` is the separate PostHog system — different store, different semantics, `undefined` for loading. Not what you want here.)

**Non-boolean settings today: yes, two precedents.**

1. `defaultRegionRestrictedPool` — a **string** flag holding JSON, read with `useFlag` then `tryParseJson`.
2. `getStringArrayFlag(flagKey, targetingKey)` — `configcat.ts:63`. Reads a comma-separated string flag with a `'none'` sentinel via a one-off `getValueAsync` + `new configcat.User(targetingKey)`. Used by `hooks/misc/useIsWarehouseEnabled.ts` with the project ref as the targeting key.

**Custom attributes on the User Object: already wired.** `_app.tsx:104-112` and `routes/__root.tsx:111-119`:

```ts
const customAttributes: Record<string, string> = {}
if (cloudProvider) customAttributes.cloud_provider = cloudProvider
if (selectedOrganization?.plan?.id) customAttributes.plan = selectedOrganization.plan.id
return getFlags(userEmail, customAttributes)
```

plus `is_staff` added inside `getFlags`. **So plan targeting rules work today, with no code change.**

**Region as an attribute won't work, though.** `getFlags` calls `getAllValuesAsync` **once** for the whole app with a single `User`. There is no per-region evaluation point, so "one flag, region as an attribute, targeting rules" doesn't fit the store model. Your options are:

- **(a) One text flag whose *value* is the region list** — mirrors `defaultRegionRestrictedPool`, composes with the existing store, zero provider changes. **Recommended.**
- (b) Per-region `getValueAsync` via a `getStringArrayFlag`-style helper — N evaluations, sits outside the provider store, needs its own loading state. Not worth it for one region.

You don't lose much: targeting rules still apply to the flag as a whole (staff-only rollout, percentage rollout, plan targeting), you just express *which regions* in the value rather than in the rule.

**Fail-open — yes, achievable as-is, with no call-site handling.**

Trace every failure path:

| Failure | Result |
|---|---|
| ConfigCat ad-blocked / network down | `getClient()` catches, returns `undefined` → `getFlags` returns `[]` → `flagValues.length === 0` → `flagStore.configcat` stays `{}` |
| ConfigCat throws mid-fetch | `Promise.allSettled` → rejected branch → `flagValues = []` → same |
| Flags not resolved yet | store is `{}` |
| Flag key doesn't exist | `console.error`, returns `false` |

and `useFlag` (`feature-flags.tsx:274-289`):

```ts
if (isObjectEmpty(store)) return false        // unloaded OR fetch failed
if (store[name] === undefined) { console.error(...); return false }   // missing key
```

**Every one of those yields `false`.** So define the flag as *"restrict these regions"*: `false` → `tryParseJson(false)` → `undefined` → empty restriction map → region stays selectable. Hard fail-open by construction.

**Is there a window where flags read false-but-should-be-true?** Yes in principle — but the region picker is not interactive during it. `useOrganizationAvailableRegionsQuery` is `enabled: flagsLoaded && smartRegionEnabled` (`RegionSelector.tsx:103`, `ProjectCreationForm.tsx:272`), so while `hasLoaded` is false the query is `isPending`, `isLoading` is true, and the `<Select>` is `disabled` showing "Loading available regions…". The ConfigCat SDK's AutoPoll `maxInitWaitTime` (5s default) bounds it. `flagStore.hasLoaded = true` is set **unconditionally** after `Promise.allSettled`, so a ConfigCat outage doesn't hang the form — it resolves to "no restrictions" and the picker opens.

Two things not to do: don't invert to a default-true flag, and don't gate your own render on `hasLoaded` (you'd be re-implementing a guarantee you already have).

One residual race worth knowing about, and the reason for the recommendation below: the `plan` custom attribute is resolved at provider level from `useSelectedOrganizationQuery`, and flags **refetch** when `selectedOrganization?.plan?.id` changes. Switching org in the form navigates to `/new/${slug}` (`OrganizationSelector.tsx:67`) so the slug stays in sync, but there's a network round trip during which the flags still carry the previous org's plan. **So evaluate the plan comparison client-side off `isFreePlan`, not via a ConfigCat plan targeting rule.** Same outcome, no race, and it's testable.

---

## 5. Interaction risk with the platform

**Does the platform already return a disabled-region signal Studio reads?** Yes — `status?: 'capacity' | 'other'` on `all.specific[]`, described in §1A. Studio disables the option and badges it for `'capacity'`; `'other'` disables silently.

**Double-block / conflicting copy.** Real, and worth an explicit precedence decision:

- If the platform's merged flag *also* sets `status` on the available-regions response, Studio already disables the region — and your free-plan flag would be redundant but consistent. The conflict is **copy**: platform says "at capacity", yours says "available on paid plans — upgrade to unlock". Two different stories for the same disabled option.
- **Suggested precedence: platform `status` wins.** Apply your flag only to regions where `status === undefined`. One line in the resolver, and it means enabling the platform flag can never produce the wrong message.
- If the platform blocks at create time but does **not** set `status`, the user gets a raw API error on submit. It'll land in telemetry as `region_unavailable` (`lib/telemetry/funnel-errors.ts:37`, `[/region/i, 'region_unavailable']`), so it's at least observable.

**Things that bypass a client-side gate:**

1. **Stale caches, both layers.** Regions: `staleTime` 5 min with all `refetchOn*` disabled in the form's copy of the query — a stale list survives SPA navigation. ConfigCat: 7-minute AutoPoll. Budget ~10 minutes between flipping the flag and full effect.
2. **URL query params — clean.** `ProjectCreationForm.tsx:114` reads only `slug`, `projectName`, `externalId`. No region prefill anywhere in Studio.
3. **Restore / clone to new project** — `CreateNewProjectDialog.tsx` has no region field at all; the clone lands in the source project's region. A free org with an existing `sa-east-1` project can provision new `sa-east-1` compute here. **This is the most likely real bypass.**
4. **Project resume** — `ResumeProjectButton.tsx`; unpausing re-provisions in the project's existing region.
5. **Read replicas** — `ReadReplicaForm/index.tsx` picks from `AVAILABLE_REPLICA_REGIONS` and never calls available-regions. It *is* plan-gated upstream (`useCheckEligibilityDeployReplica` excludes free), so probably not a free-plan bypass — but confirm rather than assume.
6. **Smart groups** — §2. Picking "Americas" may still land in São Paulo.
7. **Management API / MCP** — out of scope by decision; nothing client-side touches them.
8. **Support / internal tooling** — the `adminStudioLink` flag points at an app outside this repo; unknown from here.

---

## 6. Recommendation

**Extend the existing mechanism. One ConfigCat text flag. Do not build a parallel system.**

Why:

1. The expensive part — a per-region option renderer that disables, badges, and tooltips off a status value, with the `pointer-events-auto!` trick needed to keep tooltips alive on disabled items — **already exists and works.**
2. The data shape is already a string enum, so a third state is a union widening, not a redesign.
3. `defaultRegionRestrictedPool` is a working precedent for a ConfigCat JSON-string flag carrying region identifiers, including the fail-open parse. Copy the shape, not the lever.
4. `shared-data` is off-limits (docs + www read it). The platform API is the "right" home long-term but needs the platform team and a release you don't control this week — and the whole point is measuring runway *now*.
5. Plan is already in scope in the form and already a ConfigCat attribute.

### The flag

**Key:** `projectCreationRestrictedRegions` · **Type:** Text · **Default:** empty

```json
{ "sa-east-1": "paid_only" }
```

Values: `"unavailable" | "paid_only"`. Anything missing, unparseable, `false`, or an unknown value → no restriction. Keyed by **region code**, not `AWS_REGIONS` key (the API list is code-keyed; `defaultRegionRestrictedPool` uses keys and that's the more error-prone choice of the two).

Swapping which state ships first is then a ConfigCat value edit, not a deploy.

### Smallest diff

| # | File | Change | ~Lines |
|---|---|---|---|
| 1 | `components/interfaces/ProjectCreation/RegionSelector.utils.ts` **(new)** | `type RegionRestriction = 'capacity' \| 'other' \| 'unavailable' \| 'paid_only'`; `parseRestrictedRegions(flagValue: unknown)` via zod `safeParse` returning `{}` on anything unexpected; `resolveRegionRestriction({ platformStatus, flagRestriction, isFreePlan })` with **platform status winning**; `REGION_RESTRICTION_COPY: Record<RegionRestriction, { badge: string; tooltip: string }>`; `SELECTABLE_RESTRICTIONS: Set<RegionRestriction>` so "selectable but pilled" is a one-line flip later | **~60** |
| 2 | `RegionSelector.utils.test.ts` **(new)** | Fail-open matrix (`false`, `'{}'`, garbage, unknown status string), precedence, plan sensitivity | **~80** |
| 3 | `RegionSelector.tsx` | `useFlag('projectCreationRestrictedRegions')`; accept `isFreePlan` prop; compute `restriction` inside the `:301` map; `disabled={restriction !== undefined && !SELECTABLE_RESTRICTIONS.has(restriction)}`; badge + tooltip from the copy map; for `paid_only` render an `UpgradeToPro` admonition under the field, mirroring the `affectingIncidents` block at `:350` | **~30** |
| 4 | `ProjectCreationForm.tsx` | Pass `isFreePlan` (already at `:121`) to `RegionSelector`; add a submit-time guard beside the HA check at `:468` — cheap insurance for the future selectable state, and where `funnel-errors` already categorises `region_unavailable` | **~10** |
| 5 | `tests/pages/new/[slug].test.tsx` | Add `projectCreationRestrictedRegions: false` to `DEFAULT_FLAGS` (`:260-265`); two tests — free org + flag set → São Paulo disabled with upgrade copy; paid org + same flag → selectable. The harness already parameterises both flags and the regions payload (`renderWizard({ flags })`, `DEFAULT_AVAILABLE_REGIONS`) | **~60** |

**Total ≈ 240 lines, ~140 of it production code.** No `shared-data` change. No `api-types` change. No platform dependency. No new hook, no new query, no new provider.

Deliberately **not** doing:

- Not touching `packages/shared-data/regions.ts` — docs + www read it.
- Not touching `defaultRegionRestrictedPool` — dead on the AWS path; leave it for a separate cleanup.
- Not gating smart groups — no `status` field to hang it on, and the platform picks the physical region.
- Not using ConfigCat plan targeting for the tier check — the attribute refetch race (§4) makes client-side `isFreePlan` both safer and testable.

---

## 7. Call sites: must change vs. knowingly not gated

### Must change for MVP

1. `apps/studio/components/interfaces/ProjectCreation/RegionSelector.tsx` — the gate itself.
2. `apps/studio/components/interfaces/ProjectCreation/RegionSelector.utils.ts` *(new)* — state resolution + copy map.
3. `apps/studio/components/interfaces/ProjectCreation/ProjectCreationForm.tsx` — pass plan, submit-time guard.
4. `apps/studio/components/interfaces/ProjectCreation/RegionSelector.utils.test.ts` *(new)* + `apps/studio/tests/pages/new/[slug].test.tsx` — coverage.

**Covered for free, no change needed:** the Vercel deploy-button new-project flow (`pages/integrations/vercel/[slug]/deploy-button/new-project.tsx:126`) renders the same `ProjectCreationForm`, so it inherits the gate.

### Knowingly not gated — for the PR description and support ticket templates

1. **Management API `POST /v1/projects` and MCP `create_project`** — explicitly out of scope; needs the 3-week breaking-change notice. Anyone with a PAT can still create in `sa-east-1`.
2. **Smart region groups** — a free user picking "Americas" (which is the *default* on AWS) may still be routed to `sa-east-1` platform-side. `all.smartGroup[]` has no `status` field. **Highest-impact known leak.** See open question 2.
3. **Restore / clone to new project** — `Database/Backups/RestoreToNewProject/CreateNewProjectDialog.tsx`. No region field; the clone inherits the source project's region. A free org with an existing `sa-east-1` project provisions new `sa-east-1` compute here.
4. **Project resume / unpause** — `Project/ResumeProjectButton.tsx`. Re-provisions in the project's existing region.
5. **Read replicas** — `Settings/Infrastructure/ReadReplicas/ReadReplicaForm/index.tsx` + `AVAILABLE_REPLICA_REGIONS`. Own picker, never calls available-regions, no `status` awareness. Plan-gated upstream (`useCheckEligibilityDeployReplica` excludes free), so likely moot for *this* MVP — verify before claiming it in the PR.
6. **Branch creation** — `BranchManagement/CreateBranchModal.tsx`. No region choice; inherits the parent project.
7. **Stale client state** — up to ~5 min of cached region list plus up to 7 min of ConfigCat poll after you flip the flag. Support should expect ~10 min of lag, and a hard refresh clears it.
8. **Self-hosted / non-platform** — `FeatureFlagProvider` is `enabled={IS_PLATFORM}`; the flag never resolves and everything stays selectable. Correct behaviour, worth stating.

---

## 8. Open questions I couldn't resolve from code

1. **Does `GET /platform/projects/available-regions` already vary `status` by the org's plan?** `organization_slug` is a required query param and Studio ignores the possibility. **Ask the platform team before building** — if they'll return a third status value, most of §6 disappears and you just widen the client union.
2. **What does the platform do with a smart-group selection when a member region is capacity-marked or disabled?** If `americas` can silently resolve to `sa-east-1`, a client-side gate on the specific list leaks through the *default* path. This determines whether the MVP is worth shipping as designed.
3. **What does `status: 'other'` mean, and is it in use?** It disables the option with no badge and no explanation (`RegionSelector.tsx:328` only branches on `'capacity'`). Either a dead branch or a silent-disable bug — worth deciding whether to fix in the same PR.
4. **The merged platform-side block on staging `eu-central-1` — does it also set `status` on the available-regions response, or only reject at create time?** Determines whether a double-block shows one message or two, and whether the "platform status wins" precedence rule is sufficient.
5. **Is `defaultRegionRestrictedPool` still set to anything in ConfigCat?** It's only read on the `AWS_NIMBUS` path now, so it's likely dormant. If so, propose deleting it in a follow-up — two dormant region flags is one too many.
6. **Free plans send no `desired_instance_size`.** `instanceSize` is `undefined` when `isFreePlan` (`ProjectCreationForm.tsx:211`, `:511`), so the available-regions query runs without the param that `#39631` added specifically to make `status` accurate. Confirm the platform's status calculation is still meaningful for free-plan requests — if it defaults to `micro`, fine; if it returns nothing, the existing capacity UI may already be silently inert for exactly the users you're targeting.
7. **Product: where does the `paid_only` upgrade CTA go** — org billing page, or the upgrade dialog? `UpgradePlanButton` takes a `source` prop for attribution; needs a value.
8. **Copy sign-off.** Both strings need a `copywriting` skill pass before merge, and the repo is public — keep capacity specifics out of the user-facing text.
