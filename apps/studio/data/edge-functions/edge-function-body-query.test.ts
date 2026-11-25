import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getEdgeFunctionBody, isFunctionBodyMaxSizeError } from './edge-function-body-query'
import { addAPIMock } from '@/tests/lib/msw'

describe('isFunctionBodyMaxSizeError', () => {
  it('is true for a 507 error', () => {
    expect(isFunctionBodyMaxSizeError({ code: 507 })).toBe(true)
  })

  it('is false for other status codes', () => {
    expect(isFunctionBodyMaxSizeError({ code: 500 })).toBe(false)
    expect(isFunctionBodyMaxSizeError({})).toBe(false)
  })

  it('is false when there is no error', () => {
    expect(isFunctionBodyMaxSizeError(null)).toBe(false)
    expect(isFunctionBodyMaxSizeError(undefined)).toBe(false)
  })
})

describe('getEdgeFunctionBody', () => {
  const variables = { projectRef: 'default', slug: 'hello' }
  const metadata = { deno2_entrypoint_path: 'index.ts' }

  function mockBundle(files: { name: string; content: string }[]) {
    const form = new FormData()
    form.append('metadata', JSON.stringify(metadata))
    for (const { name, content } of files) {
      form.append('file', new Blob([content]), name)
    }

    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/functions/:function_slug/body',
      response: () => {
        const response = new Response(form)
        return new HttpResponse(response.body, { headers: response.headers })
      },
    })
  }

  it('returns each identical file part once and preserves distinct paths and metadata', async () => {
    const entry = { name: 'index.ts', content: "import './module.mjs'" }
    const module = { name: 'module.mjs', content: 'export const value = 1' }
    const other = { name: 'lib/module.mjs', content: module.content }
    const empty = { name: 'empty.mjs', content: '' }
    mockBundle([entry, module, empty, module, other, empty])

    await expect(getEdgeFunctionBody(variables)).resolves.toEqual({
      metadata,
      files: [entry, module, empty, other],
    })
  })

  it('preserves different contents at the same path in their original order', async () => {
    const first = { name: 'module.mjs', content: 'export const value = 1' }
    const second = { name: 'module.mjs', content: 'export const value = 2' }
    mockBundle([first, second, second, first])

    await expect(getEdgeFunctionBody(variables)).resolves.toEqual({
      metadata,
      files: [first, second],
    })
  })
})
