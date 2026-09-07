import { asSchema } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import { createSkillCatalog } from './skills'

const executionOptions = { toolCallId: 'load-skill', messages: [], context: undefined }

describe('createSkillCatalog', () => {
  it('lists descriptions and loads only the selected skill when executed', async () => {
    const loadDatabase = vi.fn(() => 'Detailed database instructions')
    const loadStorage = vi.fn(async () => 'Detailed storage instructions')
    const catalog = createSkillCatalog([
      { name: 'database', description: 'Design database schemas.', load: loadDatabase },
      { name: 'storage', description: 'Store and retrieve files.', load: loadStorage },
    ])

    expect(catalog.instructions()).toContain('`load_skill`')
    expect(catalog.instructions()).toContain('- database: Design database schemas.')
    expect(catalog.instructions()).toContain('- storage: Store and retrieve files.')
    expect(catalog.instructions()).not.toContain('Detailed')
    expect(loadDatabase).not.toHaveBeenCalled()
    expect(loadStorage).not.toHaveBeenCalled()

    await expect(catalog.tool.execute!({ name: 'storage' }, executionOptions)).resolves.toBe(
      'Detailed storage instructions'
    )
    expect(loadDatabase).not.toHaveBeenCalled()
    expect(loadStorage).toHaveBeenCalledOnce()
  })

  it('supports an integration-specific tool name and preserves the name input', async () => {
    const catalog = createSkillCatalog([
      { name: 'pg_best-practices', description: 'Database guidance.', load: () => 'Instructions' },
    ])

    expect(catalog.instructions('load_knowledge')).toContain('`load_knowledge`')
    expect(catalog.instructions('load_knowledge')).not.toContain('`load_skill`')
    const schema = asSchema(catalog.tool.inputSchema)
    expect(await schema.jsonSchema).toMatchObject({
      type: 'object',
      properties: { name: { type: 'string', enum: ['pg_best-practices'] } },
      required: ['name'],
    })
    expect(await schema.validate!({ name: 'pg_best-practices' })).toMatchObject({ success: true })
    expect(await schema.validate!({ name: 'unknown' })).toMatchObject({ success: false })
  })

  it.each(['unknown', '../database', '__proto__', 'constructor'])(
    'rejects an unregistered skill in direct execution: %s',
    async (name) => {
      const load = vi.fn(() => 'Instructions')
      const catalog = createSkillCatalog([
        { name: 'database', description: 'Database guidance.', load },
      ])

      await expect(catalog.tool.execute!({ name }, executionOptions)).rejects.toThrow(
        'Unknown skill'
      )
      expect(load).not.toHaveBeenCalled()
    }
  )

  it('reloads instructions and keeps separate catalogs isolated', async () => {
    const firstLoad = vi
      .fn()
      .mockResolvedValueOnce('First version')
      .mockResolvedValueOnce('Updated version')
    const secondLoad = vi.fn(() => 'Another request')
    const first = createSkillCatalog([
      { name: 'database', description: 'Database guidance.', load: firstLoad },
    ])
    const second = createSkillCatalog([
      { name: 'database', description: 'Database guidance.', load: secondLoad },
    ])

    await expect(first.tool.execute!({ name: 'database' }, executionOptions)).resolves.toBe(
      'First version'
    )
    await expect(first.tool.execute!({ name: 'database' }, executionOptions)).resolves.toBe(
      'Updated version'
    )
    expect(secondLoad).not.toHaveBeenCalled()
    await expect(second.tool.execute!({ name: 'database' }, executionOptions)).resolves.toBe(
      'Another request'
    )
    expect(firstLoad).toHaveBeenCalledTimes(2)
  })

  it('propagates loader failures so callers can report unavailable instructions', async () => {
    const catalog = createSkillCatalog([
      {
        name: 'database',
        description: 'Database guidance.',
        load: async () => {
          throw new Error('Skill source unavailable')
        },
      },
    ])

    await expect(catalog.tool.execute!({ name: 'database' }, executionOptions)).rejects.toThrow(
      'Skill source unavailable'
    )
  })

  it('rejects an empty catalog', () => {
    expect(() => createSkillCatalog([])).toThrow('at least one skill')
  })

  it('rejects duplicate names before loading either skill', () => {
    const load = vi.fn(() => 'Instructions')
    expect(() =>
      createSkillCatalog([
        { name: 'database', description: 'Database guidance.', load },
        { name: 'database', description: 'More guidance.', load },
      ])
    ).toThrow('already exists')
    expect(load).not.toHaveBeenCalled()
  })

  it.each(['', '../database', 'database/sql', 'Database', 'two words', 'database\n'])(
    'rejects an invalid skill name: %j',
    (name) => {
      expect(() =>
        createSkillCatalog([{ name, description: 'Guidance.', load: () => '' }])
      ).toThrow('Invalid skill name')
    }
  )

  it.each(['', '  \n\t'])('rejects an empty skill description: %j', (description) => {
    expect(() => createSkillCatalog([{ name: 'database', description, load: () => '' }])).toThrow(
      'requires a description'
    )
  })
})
