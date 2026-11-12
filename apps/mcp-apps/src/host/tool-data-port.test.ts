import { describe, expect, it, vi } from 'vitest'

import { createToolDataPort, type CallTool } from './tool-data-port'

const ok = (structuredContent: unknown) => ({ structuredContent })

describe('createToolDataPort', () => {
  it('calls the app tool the contract names and returns its validated result', async () => {
    // The server registers tools from the same contract, so names and shapes stay in step.
    const callTool = vi.fn<CallTool>(async () => ok({ schemas: [{ name: 'public' }] }))
    const data = createToolDataPort(callTool)
    await expect(data.listSchemas({ project_id: 'ref' })).resolves.toEqual({
      schemas: [{ name: 'public' }],
    })
    expect(callTool).toHaveBeenCalledWith('app_list_schemas', { project_id: 'ref' })
  })

  it('rejects arguments the contract does not allow before calling the server', async () => {
    const callTool = vi.fn<CallTool>()
    const data = createToolDataPort(callTool)
    await expect(
      data.readTable({ project_id: 'ref', schema: 'public', table: 't', limit: 5000 })
    ).rejects.toThrow()
    expect(callTool).not.toHaveBeenCalled()
  })

  it('rejects results that do not match the contract', async () => {
    // A view must never render a half-understood payload as if it were complete.
    const data = createToolDataPort(async () => ok({ schemas: 'public' }))
    await expect(data.listSchemas({ project_id: 'ref' })).rejects.toThrow()
  })

  it('unwraps rows from shared model-facing tools', async () => {
    const data = createToolDataPort(async () => ({
      content: [
        { type: 'text', text: '{"result":"<untrusted-data-1>[{\\"n\\":1}]</untrusted-data-1>"}' },
      ],
    }))
    await expect(data.executeSql({ project_id: 'ref', query: 'select 1 as n' })).resolves.toEqual([
      { n: 1 },
    ])
  })

  it('surfaces the server error message', async () => {
    const data = createToolDataPort(async () => ({
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: { message: 'This connection is read-only' } }),
        },
      ],
    }))
    await expect(
      data.insertRow({ project_id: 'ref', schema: 'public', table: 't', values: {} })
    ).rejects.toThrow('This connection is read-only')
  })

  it('leaves project_id to the server for shared tools on a scoped connection', async () => {
    // The server injects the scoped project into model tools and rejects a second one.
    const callTool = vi.fn<CallTool>(async () => ({
      content: [{ type: 'text', text: JSON.stringify({ tables: [] }) }],
    }))
    const data = createToolDataPort(callTool, { scopedProjectId: () => 'ref' })
    await data.listTables({ project_id: 'ref', schemas: ['public'] })
    expect(callTool).toHaveBeenCalledWith('list_tables', { schemas: ['public'] })
    await expect(data.listTables({ project_id: 'other', schemas: ['public'] })).rejects.toThrow(
      'outside the connection'
    )
    // App-only tools check scope themselves and still receive it.
    callTool.mockResolvedValueOnce(ok({ schemas: [] }))
    await data.listSchemas({ project_id: 'ref' })
    expect(callTool).toHaveBeenLastCalledWith('app_list_schemas', { project_id: 'ref' })
  })

  it('reads object results from shared tools as they are, keeping only contract fields', async () => {
    const data = createToolDataPort(async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            notebooks: [
              {
                id: 'nb',
                name: 'Signups',
                description: null,
                favorite: false,
                updated_at: '2026-11-10T00:00:00Z',
                owner: { id: 1, username: 'ada' },
              },
            ],
          }),
        },
      ],
    }))
    const { notebooks } = await data.listNotebooks({ project_id: 'ref' })
    expect(notebooks).toEqual([
      {
        id: 'nb',
        name: 'Signups',
        description: null,
        favorite: false,
        updated_at: '2026-11-10T00:00:00Z',
      },
    ])
  })
})
