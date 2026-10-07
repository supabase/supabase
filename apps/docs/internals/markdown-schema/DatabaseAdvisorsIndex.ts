import { readFileSync } from 'node:fs'
import path from 'node:path'
import { healthAdvisors } from '~/data/health-advisors.data'

const ADVISORS_PATH = path.join(process.cwd(), 'features/docs/generated/database-advisors.json')

interface Lint {
  path: string
  content: string
}

export const DatabaseAdvisorsIndex = (): string => {
  const lints: Lint[] = JSON.parse(readFileSync(ADVISORS_PATH, 'utf-8'))

  return [...healthAdvisors, ...lints]
    .map(
      (lint) => `### ${lint.path}
  
${lint.content}`
    )
    .join('\n\n')
}
