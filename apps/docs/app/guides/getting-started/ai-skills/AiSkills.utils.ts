import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GENERATED_DIRECTORY } from '~/lib/docs'
import { cache } from 'react'

interface SkillSummary {
  name: string
  description: string
  installCommand: string
}

async function getAiSkillsImpl(): Promise<SkillSummary[]> {
  const raw = await readFile(join(GENERATED_DIRECTORY, 'ai-skills.json'), 'utf-8')
  return JSON.parse(raw)
}

export const getAiSkills = cache(getAiSkillsImpl)
