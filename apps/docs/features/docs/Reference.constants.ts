/**
 * Standalone constants for the reference pipeline.
 *
 * This file intentionally has no runtime dependencies — and in particular,
 * it must NOT import anything that transitively pulls in `next/navigation`,
 * `next/headers`, or any other client-only module. It is loaded by both UI
 * code (e.g. `Reference.generated.singleton.ts` used in app routes) and
 * server-only scripts run with `tsx --conditions=react-server`
 * (e.g. `scripts/llms.ts`), where the server React build lacks
 * `createContext` and Next.js client modules crash on import.
 */

/**
 * SDK/version pairs (`${sdkId}-${version}`) that opt into the new reference
 * content pipeline produced by `scripts/build-reference-content.ts`. Anything
 * not listed here keeps reading from the legacy `features/docs/generated/`
 * outputs.
 */
export const SUPPORTS_NEW_REFERENCE_PROCESS = new Set(['javascript-v2', 'dart-v2'])
