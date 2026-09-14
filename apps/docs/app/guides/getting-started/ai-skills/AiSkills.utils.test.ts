import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAiSkillsImpl } from './AiSkills.utils'

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
  readFile: readFileMock,
}))

describe('getAiSkillsImpl', () => {
  beforeEach(() => {
    readFileMock.mockReset()
  })

  it('parses the generated skills JSON', async () => {
    const skills = [
      {
        name: 'supabase',
        description: 'Work with Supabase',
        installCommand: 'npx skills add supabase/agent-skills --skill supabase',
      },
      {
        name: 'supabase-postgres-best-practices',
        description: 'Postgres best practices',
        installCommand:
          'npx skills add supabase/agent-skills --skill supabase-postgres-best-practices',
      },
    ]
    readFileMock.mockResolvedValue(JSON.stringify(skills))

    await expect(getAiSkillsImpl()).resolves.toEqual(skills)
  })

  it('propagates errors reading the generated file', async () => {
    readFileMock.mockRejectedValue(new Error('ENOENT'))

    await expect(getAiSkillsImpl()).rejects.toThrow('ENOENT')
  })

  it('throws when the generated JSON is not an array', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ name: 'supabase' }))

    await expect(getAiSkillsImpl()).rejects.toThrow('Malformed ai-skills.json')
  })

  it('throws when an entry is missing required string fields', async () => {
    readFileMock.mockResolvedValue(JSON.stringify([{ name: 'supabase', description: 'x' }]))

    await expect(getAiSkillsImpl()).rejects.toThrow('Malformed ai-skills.json')
  })
})
