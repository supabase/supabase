/**
 * Imperative, module-level accessor for the `pgMetaScopedIntrospection` rollout
 * flag (see PG_META_SCOPED_INTROSPECTION_FLAG in
 * `@/data/table-editor/table-editor-query`).
 *
 * Query hooks that only opt into `scoped` pg-meta introspection (rather than
 * threading `scoped` through their own React Query key, the way PR #47894
 * threads it for the table-editor query) read the flag's current value from
 * here instead of taking it as a prop/param. `setScopedIntrospection` is
 * called once from a bridge component mounted under the app's
 * FeatureFlagProvider (see `ScopedIntrospectionFlagBridge` in
 * `pages/_app.tsx`) whenever the flag value resolves/changes.
 *
 * Accepted tradeoff (decided in review): because `scoped` is not part of
 * these queries' cache keys, a flag flip mid-session can serve stale-keyed
 * cached data (fetched under the previous decision) until the query next
 * refetches (staleTime elapsing, remount, manual invalidation, etc). This is
 * acceptable because `pgMetaScopedIntrospection` is a session-stable rollout
 * flag, not something expected to flip while a user is actively using the
 * app.
 */
let scopedIntrospection = false

export const setScopedIntrospection = (value: boolean) => {
  scopedIntrospection = value
}

export const isScopedIntrospection = () => scopedIntrospection
