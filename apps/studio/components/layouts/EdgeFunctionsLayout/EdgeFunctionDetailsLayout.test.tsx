import { Blob as NodeBlob } from 'node:buffer'
import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, expect, it, vi } from 'vitest'

import EdgeFunctionDetailsLayout from './EdgeFunctionDetailsLayout'
import { formatFunctionBodyToFiles } from '@/components/interfaces/EdgeFunctions/EdgeFunctions.utils'
import { MainScrollContainerProvider } from '@/components/layouts/MainScrollContainerContext'
import { MobileSheetProvider } from '@/components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { configKeys } from '@/data/config/keys'
import { customDomainKeys } from '@/data/custom-domains/keys'
import type { EdgeFunctionBodyData } from '@/data/edge-functions/edge-function-body-query'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { miscKeys } from '@/data/misc/keys'
import { projectKeys } from '@/data/projects/keys'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const mocks = vi.hoisted(() => ({
  useParams: vi.fn<() => { ref?: string; functionSlug?: string }>(() => ({ ref: 'default' })),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => mocks.useParams(),
  }
})

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
const spies: Array<{ mockRestore: () => void }> = []

afterEach(() => {
  mocks.useParams.mockReturnValue({ ref: 'default' })
  vi.unstubAllGlobals()
  while (spies.length > 0) spies.pop()?.mockRestore()
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

function setupLayoutTest({
  functionSlug,
  functionBody,
}: {
  functionSlug?: string
  functionBody?: EdgeFunctionBodyData
} = {}) {
  HTMLElement.prototype.scrollTo = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(configKeys.settingsV2('default'), {
    app_config: { endpoint: 'localhost:54321', protocol: 'http' },
  })
  queryClient.setQueryData(subscriptionKeys.addons('default'), { selected_addons: [] })
  queryClient.setQueryData(customDomainKeys.list('default'), {})
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  queryClient.setQueryData<EdgeFunction>(edgeFunctionsKeys.detail('default', functionSlug), {
    id: 'function-id',
    name: functionSlug ?? 'Send email',
    slug: functionSlug ?? 'send-email',
    status: 'ACTIVE',
    version: 2,
    created_at: new Date('2026-03-20T08:00:00Z').valueOf(),
    updated_at: new Date('2026-03-20T09:00:00Z').valueOf(),
  })
  if (functionBody) {
    queryClient.setQueryData<EdgeFunctionBodyData>(
      edgeFunctionsKeys.body('default', functionSlug),
      functionBody
    )
  }

  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/authorization',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'No GitHub authorization' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<never[]>([]),
  })

  return queryClient
}

it('lets self-hosted users copy the function URL from the detail toolbar', async () => {
  const user = userEvent.setup()
  const queryClient = setupLayoutTest()

  customRender(
    <BannerStackProvider>
      <MobileSheetProvider>
        <MainScrollContainerProvider>
          <EdgeFunctionDetailsLayout title="Settings">Function settings</EdgeFunctionDetailsLayout>
        </MainScrollContainerProvider>
      </MobileSheetProvider>
    </BannerStackProvider>,
    { queryClient }
  )

  await user.click(await screen.findByRole('button', { name: 'Copy URL' }))

  expect(await navigator.clipboard.readText()).toBe(
    'http://localhost:54321/functions/v1/send-email'
  )
})

it('downloads an intact ZIP archive after the cached function body has been formatted for the Code tab', async () => {
  vi.stubGlobal('Blob', NodeBlob)
  mocks.useParams.mockReturnValue({ ref: 'default', functionSlug: 'auth' })
  const user = userEvent.setup()
  const cachedBody: EdgeFunctionBodyData = {
    files: [
      { name: 'source/auth/index.ts', content: 'entry' },
      { name: 'source/auth/auth/handler.ts', content: 'nested' },
      { name: 'source/auth/handler.ts', content: 'root' },
    ],
    metadata: { deno2_entrypoint_path: 'source/auth/index.ts' },
  }
  const queryClient = setupLayoutTest({ functionSlug: 'auth', functionBody: cachedBody })

  // Simulate the Code tab reading and formatting the shared cached function body
  formatFunctionBodyToFiles({ functionBody: cachedBody })

  let downloadedBlob: globalThis.Blob | undefined
  spies.push(
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj) => {
      downloadedBlob = obj as globalThis.Blob
      return 'blob:edge-function-zip'
    }),
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {}),
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  )

  customRender(
    <BannerStackProvider>
      <MobileSheetProvider>
        <MainScrollContainerProvider>
          <EdgeFunctionDetailsLayout title="Code">Code editor</EdgeFunctionDetailsLayout>
        </MainScrollContainerProvider>
      </MobileSheetProvider>
    </BannerStackProvider>,
    { queryClient }
  )

  await user.click(await screen.findByRole('button', { name: 'Download' }))
  await user.click(await screen.findByRole('button', { name: 'Download as ZIP' }))

  await waitFor(() => {
    expect(downloadedBlob).toBeInstanceOf(NodeBlob)
  })

  const zipReader = new ZipReader(new BlobReader(downloadedBlob!))
  const entries = await zipReader.getEntries()
  const contents = Object.fromEntries(
    await Promise.all(
      entries.map(async (entry) => [
        entry.filename,
        entry.getData ? await entry.getData(new TextWriter()) : '',
      ])
    )
  )
  await zipReader.close()

  expect(contents).toEqual({
    'index.ts': 'entry',
    'auth/handler.ts': 'nested',
    'handler.ts': 'root',
  })
})

it('surfaces an error toast instead of downloading an incomplete ZIP when adding a ZIP entry fails', async () => {
  vi.stubGlobal('Blob', NodeBlob)
  mocks.useParams.mockReturnValue({ ref: 'default', functionSlug: 'hello' })
  const user = userEvent.setup()
  const queryClient = setupLayoutTest({
    functionSlug: 'hello',
    functionBody: {
      files: [
        { name: 'source/hello/index.ts', content: 'first' },
        { name: 'source/hello/./index.ts', content: 'duplicate' },
      ],
      metadata: { deno2_entrypoint_path: 'source/hello/index.ts' },
    },
  })

  const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unused')
  const toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '')
  spies.push(createObjectURLSpy, toastErrorSpy)

  customRender(
    <BannerStackProvider>
      <MobileSheetProvider>
        <MainScrollContainerProvider>
          <EdgeFunctionDetailsLayout title="Code">Code editor</EdgeFunctionDetailsLayout>
        </MainScrollContainerProvider>
      </MobileSheetProvider>
    </BannerStackProvider>,
    { queryClient }
  )

  await user.click(await screen.findByRole('button', { name: 'Download' }))
  await user.click(await screen.findByRole('button', { name: 'Download as ZIP' }))

  await waitFor(() => {
    expect(toastErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to download edge function:')
    )
  })
  expect(createObjectURLSpy).not.toHaveBeenCalled()
})
