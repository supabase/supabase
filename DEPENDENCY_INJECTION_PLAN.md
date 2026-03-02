 DI-Based Integration Testing for Supabase Studio

 Context

 Studio's data layer (92 feature directories under data/) directly imports get/post from data/fetchers.ts. This tight coupling means the only way to mock data in tests is via MSW
 (intercepting HTTP). A playground repo demonstrates an Effect-based DI pattern where services are injected via React Context, enabling:

 - Full-app integration tests with mock services (no HTTP layer)
 - Contract tests that verify live implementations match the interface
 - Mock variants (empty, with-data, with-error, never-resolves, stateful+spies)

 We adopt this pattern without Effect, using TypeScript interfaces + React Context. The service registry is always present — production uses live implementations, tests use mocks. Real
 providers (Auth, Profile, FeatureFlags) are reused in both environments with dependencies injected from the registry. Full-app integration tests run as Vitest browser tests.

 ---
 Architecture

 Service registry — always present

 The registry is provided at the top of the component tree in both production and tests. No fallback pattern — hooks always read from the registry.

 // lib/services/registry.ts
 export interface ServiceRegistry {
   projects: ProjectsService
   storage: StorageService
   organizations: OrganizationsService
   profile: ProfileService
   permissions: PermissionsService
   auth: AuthService           // wraps GoTrue operations
   featureFlags: FeatureFlagService  // wraps ConfigCat + PostHog
 }

 // lib/services/context.ts
 const ServiceRegistryContext = createContext<ServiceRegistry>(null!)
 export const ServiceRegistryProvider = ServiceRegistryContext.Provider

 export function useService<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] {
   return useContext(ServiceRegistryContext)[key]
 }

 Production setup (_app.tsx)

 // In _app.tsx, wrap the entire app with the live registry:
 const registry = useMemo(() => createLiveRegistry(), [])

 <ServiceRegistryProvider value={registry}>
   <AuthProvider gotrueClient={registry.auth.client}>
     <FeatureFlagProvider getFlags={registry.featureFlags.getFlags} ...>
       <ProfileProvider>
         {/* rest of app */}
       </ProfileProvider>
     </FeatureFlagProvider>
   </AuthProvider>
 </ServiceRegistryProvider>

 Test setup

 // In tests, same provider tree but with mock registry:
 const registry = createMockRegistry({ overrides })

 <ServiceRegistryProvider value={registry}>
   <AuthProvider gotrueClient={registry.auth.client}>
     <FeatureFlagProvider getFlags={registry.featureFlags.getFlags} ...>
       <ProfileProvider>
         {/* page + layouts via getLayout */}
       </ProfileProvider>
     </FeatureFlagProvider>
   </AuthProvider>
 </ServiceRegistryProvider>

 Real providers with injected dependencies

 Providers are the same real components in both environments. Their external dependencies come from the registry:

 ┌──────────────────────────────┬──────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
 │           Provider           │                       Dependency from registry                       │                              Current state                               │
 ├──────────────────────────────┼──────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
 │ AuthProvider (common)        │ gotrueClient — pass as prop                                          │ Currently uses module singleton. Modify common to accept client as prop. │
 ├──────────────────────────────┼──────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
 │ FeatureFlagProvider (common) │ getConfigCatFlags prop (already supported), add getPostHogFlags prop │ Partially injectable. Add prop for PostHog flag fetcher.                 │
 ├──────────────────────────────┼──────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
 │ ProfileProvider              │ useProfileQuery goes through ProfileService from registry            │ Currently fetches directly. Migrate hook.                                │
 └──────────────────────────────┴──────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────┘

 Hook migration (no fallback)

 Hooks always use the service from the registry:

 // data/projects/project-detail-query.ts
 export const useProjectDetailQuery = ({ ref }, options = {}) => {
   const { getProjectDetail } = useService('projects')

   return useQuery({
     queryKey: projectKeys.detail(ref),
     queryFn: ({ signal }) => getProjectDetail({ ref }, signal),
     enabled: typeof ref !== 'undefined',
     ...options,
   })
 }

 Live implementations (wiring)

 // data/projects/projects-service-live.ts
 import { getProjectDetail } from './project-detail-query'
 import { createProject } from './project-create-mutation'

 export const projectsServiceLive: ProjectsService = {
   getProjectDetail,   // existing function, unchanged
   createProject,      // existing function, unchanged
 }

 The existing async fetcher functions (getProjectDetail, createProject, etc.) are untouched — they still import get/post from data/fetchers and call the API. The service interface just
 references them.

 ---
 Full-Page Integration Testing

 Rendering approach

 Import the page component, call its getLayout, wrap with the same provider tree used in production but with a mock registry:

 // tests/lib/render-app.tsx
 import { routerMock } from 'tests/lib/route-mock'

 export function renderApp(
   PageComponent: NextPageWithLayout,
   opts: {
     services?: Partial<ServiceRegistry>
     path?: string
     pageProps?: Record<string, unknown>
   } = {}
 ) {
   if (opts.path) routerMock.setCurrentUrl(opts.path)

   const registry = createMockRegistry(opts.services)

   const page = <PageComponent {...(opts.pageProps ?? {})} />
   const withLayout = PageComponent.getLayout?.(page) ?? page

   // Same provider tree as _app.tsx, but with mock registry
   return render(
     <AppProviders registry={registry}>
       {withLayout}
     </AppProviders>
   )
 }

 AppProviders — shared between production and tests

 Extract the provider tree from _app.tsx into a reusable component:

 // lib/app-providers.tsx — used by BOTH _app.tsx and test helper
 export function AppProviders({
   registry,
   queryClient,
   children,
 }: {
   registry: ServiceRegistry
   queryClient?: QueryClient
   children: ReactNode
 }) {
   const client = queryClient ?? getQueryClient()

   return (
     <QueryClientProvider client={client}>
       <NuqsAdapter>
         <ServiceRegistryProvider value={registry}>
           <AuthProvider gotrueClient={registry.auth.client}>
             <FeatureFlagProvider
               API_URL={API_URL}
               enabled={IS_PLATFORM}
               getConfigCatFlags={registry.featureFlags.getConfigCatFlags}
               getPostHogFlags={registry.featureFlags.getPostHogFlags}
             >
               <ProfileProvider>
                 <TooltipProvider>
                   <ThemeProvider>
                     {children}
                   </ThemeProvider>
                 </TooltipProvider>
               </ProfileProvider>
             </FeatureFlagProvider>
           </AuthProvider>
         </ServiceRegistryProvider>
       </NuqsAdapter>
     </QueryClientProvider>
   )
 }

 Production _app.tsx uses <AppProviders registry={liveRegistry}>. Tests use <AppProviders registry={mockRegistry}>. Same code path.

 Layout data dependencies

 The layout chain (DefaultLayout → ProjectLayout → StorageLayout) fetches data through hooks that are migrated to the service registry:

 ┌─────────────────────────────────────┬────────────────────────────────┬────────────────────────────────────┐
 │        Hook in layout chain         │         Service method         │              Used by               │
 ├─────────────────────────────────────┼────────────────────────────────┼────────────────────────────────────┤
 │ useProjectDetailQuery               │ projects.getProjectDetail      │ ProjectLayout, FeatureFlagProvider │
 ├─────────────────────────────────────┼────────────────────────────────┼────────────────────────────────────┤
 │ useOrganizationsQuery               │ organizations.getOrganizations │ FeatureFlagProvider                │
 ├─────────────────────────────────────┼────────────────────────────────┼────────────────────────────────────┤
 │ useProfileQuery                     │ profile.getProfile             │ ProfileProvider                    │
 ├─────────────────────────────────────┼────────────────────────────────┼────────────────────────────────────┤
 │ usePermissionsQuery                 │ permissions.getPermissions     │ withAuth HOC, ProfileProvider      │
 ├─────────────────────────────────────┼────────────────────────────────┼────────────────────────────────────┤
 │ useAuthenticatorAssuranceLevelQuery │ auth.getMfaAssuranceLevel      │ withAuth HOC                       │
 └─────────────────────────────────────┴────────────────────────────────┴────────────────────────────────────┘

 All these hooks use mock services in tests, so layouts render correctly with mock data.

 ---
 Vitest Browser Tests

 Full-app integration tests run in a real browser via Vitest browser mode with Playwright.

 Configuration

 // vitest.config.ts — use projects to run both jsdom and browser tests
 import { defineConfig } from 'vitest/config'
 import { playwright } from '@vitest/browser-playwright'

 export default defineConfig({
   test: {
     projects: [
       {
         extends: true,
         test: {
           name: 'unit',
           include: ['tests/**/*.test.{ts,tsx}'],
           exclude: ['tests/integration/**'],
           environment: 'jsdom',
           setupFiles: ['tests/vitestSetup.ts'],
         },
       },
       {
         extends: true,
         test: {
           name: 'integration',
           include: ['tests/integration/**/*.test.{ts,tsx}'],
           browser: {
             enabled: true,
             provider: playwright(),
             instances: [{ browser: 'chromium' }],
           },
           setupFiles: ['tests/integrationSetup.ts'],
         },
       },
     ],
   },
 })

 Running tests

 # All tests (unit + integration)
 npx vitest

 # Only unit tests (existing)
 npx vitest --project unit

 # Only browser integration tests
 npx vitest --project integration

 Rendering in browser tests

 Use vitest-browser-react for component rendering in browser mode:

 // tests/integration/storage-buckets.test.tsx
 import { render } from 'vitest-browser-react'
 import { page } from 'vitest/browser'
 import StorageBucketsPage from 'pages/project/[ref]/storage/files/index'
 import { renderApp } from 'tests/lib/render-app'

 test('displays storage buckets and allows creating new ones', async () => {
   const createBucket = vi.fn().mockResolvedValue({ name: 'new-bucket' })

   renderApp(StorageBucketsPage, {
     path: '/project/test-ref/storage/files',
     services: {
       storage: createMockStorageService({
         getBuckets: vi.fn().mockResolvedValue([
           { id: 'bucket-1', name: 'photos', public: true },
         ]),
         createBucket,
       }),
     },
   })

   // Real layout chain renders (DefaultLayout → StorageLayout → ProjectLayout)
   // All layout data queries satisfied by mock services

   await expect.element(page.getByText('photos')).toBeVisible()

   await page.getByRole('button', { name: /new bucket/i }).click()
   // ... fill form, submit ...

   expect(createBucket).toHaveBeenCalledOnce()
 })

 ---
 Mock Variants

 All five variants from the playground:

 // tests/lib/service-mocks.ts

 // Full mock registry with sensible defaults
 function createMockRegistry(overrides?: Partial<ServiceRegistry>): ServiceRegistry

 // Per-service factories
 function createMockProjectsService(overrides?: Partial<ProjectsService>): ProjectsService

 // 1. Default (sensible test data)
 createMockProjectsService()

 // 2. With specific data
 createMockProjectsService({
   getProjectDetail: vi.fn().mockResolvedValue(myProject)
 })

 // 3. With error
 createMockProjectsService({
   getProjectDetail: vi.fn().mockRejectedValue(new ResponseError('fail'))
 })

 // 4. Never resolves (loading states)
 createMockProjectsService({
   getProjectDetail: vi.fn(() => new Promise(() => {}))
 })

 // 5. Stateful with spies
 const { service, state, spies } = createStatefulStorageService(initialBuckets)
 // state mutates on calls, spies.createBucket tracks invocations

 ---
 Contract Tests

 Contract tests verify live implementations against MSW-mocked APIs:

 // tests/contracts/projects-service.contract.test.ts
 import { projectsServiceLive } from 'data/projects/projects-service-live'

 describe('ProjectsService contract', () => {
   it('getProjectDetail returns expected shape', async () => {
     const result = await projectsServiceLive.getProjectDetail({ ref: 'test' })
     // Test result shape against same Zod implementation that will also be
     // used in live service, ensuring contract alignment. Make sure that
     // Zod implementation matches generated API types by writing a type test.
   })
 })

 Every method on every service interface should have a contract test. Gaps are visible: if a mock factory returns data that no contract test verifies, the contract is incomplete.

 ---
 Changes to Common Package

 Two modifications to packages/common:

 1. AuthProvider: accept GoTrue client as prop

 File: packages/common/auth.tsx

 Currently gotrueClient is a module-level singleton imported from gotrue.ts. Change AuthProviderInternal to accept an optional gotrueClient prop, falling back to the singleton for
 backward compatibility with other consumers of the common package.

 // packages/common/auth.tsx
 export function AuthProviderInternal({
   gotrueClient: injectedClient,
   children,
   ...
 }: {
   gotrueClient?: AuthClient   // NEW: optional injected client
   children: ReactNode
 }) {
   const client = injectedClient ?? defaultGotrueClient
   // ... use client instead of module singleton
 }

 2. FeatureFlagProvider: accept PostHog flag fetcher as prop

 File: packages/common/feature-flags.tsx

 Already accepts getConfigCatFlags prop. Add getPostHogFlags and trackFeatureFlag props with same pattern.

 ---
 New Files

 ┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
 │                       File                       │                             Purpose                              │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/services/registry.ts                         │ ServiceRegistry interface                                        │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/services/context.ts                          │ ServiceRegistryContext, ServiceRegistryProvider, useService()    │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/services/live-registry.ts                    │ createLiveRegistry() — assembles live implementations            │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/app-providers.tsx                            │ AppProviders — shared provider tree (used by _app.tsx and tests) │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/projects/projects-service.ts                │ ProjectsService interface                                        │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/projects/projects-service-live.ts           │ Live impl wiring                                                 │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/storage/storage-service.ts                  │ StorageService interface                                         │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/storage/storage-service-live.ts             │ Live impl wiring                                                 │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/organizations/organizations-service.ts      │ OrganizationsService interface                                   │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/organizations/organizations-service-live.ts │ Live impl wiring                                                 │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/profile/profile-service.ts                  │ ProfileService interface                                         │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/profile/profile-service-live.ts             │ Live impl wiring                                                 │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/permissions/permissions-service.ts          │ PermissionsService interface                                     │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ data/permissions/permissions-service-live.ts     │ Live impl wiring                                                 │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/services/auth-service.ts                     │ AuthService interface + live impl                                │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ lib/services/feature-flag-service.ts             │ FeatureFlagService interface + live impl                         │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ tests/lib/service-mocks.ts                       │ createMockRegistry() + per-service mock factories                │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ tests/lib/render-app.tsx                         │ renderApp() for full-page integration tests                      │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ tests/integrationSetup.ts                        │ Setup file for browser integration tests                         │
 ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ tests/integration/                               │ Directory for browser-based integration tests                    │
 └──────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

 Modified Files

 ┌──────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
 │                       File                       │                                           Change                                           │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ pages/_app.tsx                                   │ Extract providers into AppProviders, wrap with ServiceRegistryProvider using live registry │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ packages/common/auth.tsx                         │ Accept optional gotrueClient prop                                                          │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ packages/common/feature-flags.tsx                │ Accept optional getPostHogFlags / trackFeatureFlag props                                   │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/projects/project-detail-query.ts            │ useProjectDetailQuery uses useService('projects')                                          │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/projects/project-create-mutation.ts         │ useProjectCreateMutation uses useService('projects')                                       │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/storage/buckets-query.ts                    │ Bucket query hooks use useService('storage')                                               │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/storage/bucket-*-mutation.ts                │ Bucket mutation hooks use useService('storage')                                            │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/organizations/organization-query.ts         │ Uses useService('organizations')                                                           │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/organizations/organization-members-query.ts │ Uses useService('organizations')                                                           │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/profile/profile-query.ts                    │ Uses useService('profile')                                                                 │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ data/permissions/permissions-query.ts            │ Uses useService('permissions')                                                             │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ vitest.config.ts                                 │ Add projects config for unit (jsdom) + integration (browser)                               │
 ├──────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
 │ package.json                                     │ Add @vitest/browser-playwright, vitest-browser-react deps                                  │
 └──────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘

 ---
 Implementation Order

 Phase 1: Core infrastructure

 1. lib/services/registry.ts + lib/services/context.ts
 2. lib/services/auth-service.ts + lib/services/feature-flag-service.ts
 3. lib/services/live-registry.ts — createLiveRegistry()
 4. lib/app-providers.tsx — extract provider tree from _app.tsx
 5. Modify pages/_app.tsx to use AppProviders + live registry
 6. Verify: App works identically in dev (no behavior change)

 Phase 2: Common package changes

 7. Modify packages/common/auth.tsx — accept optional gotrueClient prop
 8. Modify packages/common/feature-flags.tsx — accept optional PostHog fetcher props
 9. Wire into AppProviders — pass registry deps to providers

 Phase 3: Projects + layout dependencies (reference implementation)

 10. Service interfaces + live wiring for projects, orgs, profile, permissions
 11. Migrate hooks: useProjectDetailQuery, useOrganizationsQuery, useProfileQuery, usePermissionsQuery
 12. Contract tests for all migrated services
 13. Verify: App still works identically in dev

 Phase 4: Test infrastructure

 14. Install @vitest/browser-playwright, vitest-browser-react
 15. Configure Vitest projects (unit + integration)
 16. Create tests/lib/service-mocks.ts — createMockRegistry() + per-service factories
 17. Create tests/lib/render-app.tsx — uses AppProviders + mock registry
 18. Write first full-page integration test (render a project page with layouts)

 Phase 5: Storage

 19. StorageService interface + live wiring + hook migrations
 20. Mock factory + contract tests
 21. Write storage page integration tests

 Phase 6: Expand organizations

 22. Extend OrganizationsService with members/roles
 23. Validates multi-call composition pattern

 ---
 Verification

 1. No production regression: npm run dev — app works identically after Phase 1-3
 2. Existing tests pass: npx vitest --project unit — no regressions
 3. Integration test passes: npx vitest --project integration — full-page test renders storage page with mock services, layouts render, page data appears
 4. Contract tests pass: Verify live implementations match interfaces
 5. Type checking: npx tsc --noEmit — all service interfaces, registry, hooks type-safe

---
Progress

Phase 1: Core infrastructure — steps 1-3 done ✓

New files created in apps/studio/lib/services/:

lib/services/registry.ts
  ServiceRegistry interface with auth and featureFlags slots.
  Other services (projects, orgs, profile, permissions, storage) added in later phases.

lib/services/context.ts
  ServiceRegistryContext (null! default — no fallback pattern).
  ServiceRegistryProvider = ServiceRegistryContext.Provider.
  useService(key) hook.

lib/services/auth-service.ts
  AuthService interface with named operations only — no client field.
  Rationale: exposing the full AuthClient is hard to mock; named methods are not.
    signOut() — return type inferred from gotrueClient.signOut
    getMfaAssuranceLevel() — wraps mfa.getAuthenticatorAssuranceLevel
  authServiceLive wires to gotrueClient singleton.
  Note: when Phase 2 makes AuthProvider injectable, its client prop will accept a
  separate narrow interface (initialize, onAuthStateChange, refreshSession) defined
  at that point — not added to AuthService.

lib/services/feature-flag-service.ts
  FeatureFlagService interface:
    getConfigCatFlags(userEmail?) — matches FeatureFlagProvider's existing prop type
    getPostHogFlags(options?) — wraps getFeatureFlags(); wired to FeatureFlagProvider in Phase 2
  featureFlagServiceLive wires to getFlags (configcat) and getFeatureFlags (posthog).

lib/services/live-registry.ts
  createLiveRegistry() assembles authServiceLive + featureFlagServiceLive.

No existing files modified. Steps 4-6 (app-providers.tsx + _app.tsx wiring) are next.
