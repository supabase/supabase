import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { acquireSharedRegistration, useAddDefinitions } from './useAddDefinitions'
import { addAPIMock } from '@/tests/lib/msw'
import { customRenderHook } from '@/tests/lib/custom-render'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

vi.mock('@/components/ui/CodeEditor/Providers/PgSQLCompletionProvider', () => ({
  default: vi.fn((_monaco: unknown, pgInfoRef: unknown) => ({ __pgInfoRef: pgInfoRef })),
}))
vi.mock('@/components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider', () => ({
  default: vi.fn((_monaco: unknown, pgInfoRef: unknown) => ({ __pgInfoRef: pgInfoRef })),
}))

describe('acquireSharedRegistration', () => {
  it('only registers once for multiple concurrent callers sharing a key', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    acquireSharedRegistration('test-key-1', register)
    acquireSharedRegistration('test-key-1', register)
    acquireSharedRegistration('test-key-1', register)

    expect(register).toHaveBeenCalledTimes(1)
  })

  it('registers independently per key', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    acquireSharedRegistration('test-key-2a', register)
    acquireSharedRegistration('test-key-2b', register)

    expect(register).toHaveBeenCalledTimes(2)
  })

  it('does not dispose while other callers are still holding the registration', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const releaseA = acquireSharedRegistration('test-key-3', register)
    acquireSharedRegistration('test-key-3', register)

    releaseA()

    expect(dispose).not.toHaveBeenCalled()
  })

  it('disposes once the last caller releases', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const releaseA = acquireSharedRegistration('test-key-4', register)
    const releaseB = acquireSharedRegistration('test-key-4', register)

    releaseA()
    releaseB()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('registers again after a full release cycle', () => {
    const register = vi.fn(() => ({ dispose: vi.fn() }))

    const release = acquireSharedRegistration('test-key-5', register)
    release()
    acquireSharedRegistration('test-key-5', register)

    expect(register).toHaveBeenCalledTimes(2)
  })

  it('is safe to release more times than acquired', () => {
    const dispose = vi.fn()
    const register = vi.fn(() => ({ dispose }))

    const release = acquireSharedRegistration('test-key-6', register)
    release()

    expect(() => release()).not.toThrow()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})

describe('useAddDefinitions', () => {
  const createMonaco = () =>
    ({
      languages: {
        registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
        registerSignatureHelpProvider: vi.fn(() => ({ dispose: vi.fn() })),
        registerDocumentFormattingEditProvider: vi.fn(() => ({ dispose: vi.fn() })),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

  it('keeps the registered provider reading fresh data after the registering editor unmounts, as long as a sibling editor is still active', async () => {
    const getPgsqlCompletionProvider = (
      await import('@/components/ui/CodeEditor/Providers/PgSQLCompletionProvider')
    ).default as unknown as ReturnType<typeof vi.fn>

    let keywordWords = ['select']
    setupSqlEditorMocks()
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        if (key === 'keywords') return HttpResponse.json(keywordWords.map((word) => ({ word })))
        return HttpResponse.json([])
      },
    })

    const monaco = createMonaco()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const renderOptions = { queryClient }

    // Two sibling notebook cells' editors, both mounted at once, sharing the same cache.
    const editor1 = customRenderHook(() => useAddDefinitions('', monaco, { enabled: true }), renderOptions)
    const editor2 = customRenderHook(() => useAddDefinitions('', monaco, { enabled: true }), renderOptions)

    await waitFor(() =>
      expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledTimes(1)
    )

    // The first (and only, thanks to ref-counted registration) call registered the provider —
    // capture the `pgInfoRef` it reads from.
    const pgInfoRef = getPgsqlCompletionProvider.mock.calls[0][1] as { current: { keywords: string[] } }
    await waitFor(() => expect(pgInfoRef.current.keywords).toEqual(['select']))

    // Editor 1 — the one whose render happened to trigger the registration — closes. Editor 2
    // is still open, so the provider must stay registered and stay current.
    editor1.unmount()
    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledTimes(1)

    keywordWords = ['select', 'insert']
    queryClient.invalidateQueries({ queryKey: ['projects', 'default', 'keywords'] })
    editor2.rerender()

    await waitFor(() => expect(pgInfoRef.current.keywords).toEqual(['select', 'insert']))

    editor2.unmount()
  })
})
