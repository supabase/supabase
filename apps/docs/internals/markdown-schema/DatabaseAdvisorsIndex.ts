import { readFileSync } from 'node:fs'
import path from 'node:path'

const ADVISORS_PATH = path.join(process.cwd(), 'features/docs/generated/database-advisors.json')

interface Lint {
  path: string
  content: string
}

export const DatabaseAdvisorsIndex = (): string => {
  const lints: Lint[] = JSON.parse(readFileSync(ADVISORS_PATH, 'utf-8'))

  return lints
    .map(
      (lint) => `### ${lint.path}
  
${lint.content}`
    )
    .join('\n\n')
}
