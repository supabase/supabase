import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { contract as createNotebookContract } from './create-notebook'
import { createTool } from './create-notebook-from-template.server'
import {
  buildTemplateNotebook,
  NOTEBOOK_TEMPLATE_IDS,
} from '@/components/interfaces/Explorer/templates'
import { addAPIMock } from '@/tests/lib/msw'

describe('create_notebook_from_template', () => {
  it('asks the user before adding a notebook', () => {
    expect(createTool({ aiOptInLevel: 'schema' }).needsApproval).toBe(true)
  })

  it('only accepts the ids of Studio templates', () => {
    const schema = createTool({ aiOptInLevel: 'schema' }).inputSchema
    if (!('safeParse' in schema)) throw new Error('inputSchema has no safeParse')

    expect(schema.safeParse({ template: 'security_audit' }).success).toBe(true)
    expect(schema.safeParse({ template: 'my_custom_audit' }).success).toBe(false)
  })

  // The chat shows a template proposal through the create_notebook preview, so every
  // template has to be valid create_notebook input or the user can't review it.
  it.each(NOTEBOOK_TEMPLATE_IDS)('previews the %s template like any proposed notebook', (id) => {
    expect(createNotebookContract.inputSchema.safeParse(buildTemplateNotebook(id)).success).toBe(
      true
    )
  })

  // The template's queries are the audit, so the saved notebook must carry them verbatim
  // rather than whatever the model might retype.
  it('saves the template exactly as Studio defines it', async () => {
    let sentBody: { name?: string; content?: { cells: Array<Record<string, unknown>> } } = {}
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        sentBody = (await request.json()) as typeof sentBody
        return new HttpResponse(null)
      },
    })

    const tool = createTool({ projectRef: 'test-project', aiOptInLevel: 'schema' })
    if (!tool.execute) throw new Error('execute is undefined')

    const result = await tool.execute(
      { template: 'security_audit' },
      { toolCallId: 'test', messages: [], context: {} }
    )

    const expected = buildTemplateNotebook('security_audit')
    expect(result).toMatchObject({ name: 'Security audit' })
    expect(sentBody.name).toBe('Security audit')
    expect(sentBody.content?.cells.map((cell) => cell.sql ?? cell.text)).toEqual(
      expected.content.cells.map((cell) => ('sql' in cell ? cell.sql : cell.text))
    )
    for (const cell of sentBody.content?.cells ?? []) expect(cell).not.toHaveProperty('_id')
  })
})
