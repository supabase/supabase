import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GENERATED_DIRECTORY } from '~/lib/docs'
import { cache } from 'react'

interface SkillSummary {
  name: string
  description: string
  installCommand: string
}

function isSkillSummary(value: unknown): value is SkillSummary {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SkillSummary).name === 'string' &&
    typeof (value as SkillSummary).description === 'string' &&
    typeof (value as SkillSummary).installCommand === 'string'
  )
}

export async function getAiSkillsImpl(): Promise<SkillSummary[]> {
  const raw = await readFile(join(GENERATED_DIRECTORY, 'ai-skills.json'), 'utf-8')
  const parsed: unknown = JSON.parse(raw)

  if (!Array.isArray(parsed) || !parsed.every(isSkillSummary)) {
    throw new Error('Malformed ai-skills.json: expected an array of SkillSummary objects')
  }

  return parsed
}

export const getAiSkills = cache(getAiSkillsImpl)
