import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const SKILLS_PATH = path.join(process.cwd(), 'features/docs/generated/ai-skills.json')

interface SkillSummary {
  name: string
  description: string
  installCommand: string
}

export const AiSkillsIndex = (): string => {
  // `build:guides-markdown` can run standalone (e.g. apps/www's prebuild) without
  // `build:federated-content`, so this generated artifact may not exist yet.
  if (!existsSync(SKILLS_PATH)) {
    return ''
  }

  const skills: SkillSummary[] = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'))

  return skills
    .map(
      (skill) =>
        `### ${skill.name}
      
${skill.description}
      
\`\`\`sh
${skill.installCommand}
\`\`\``
    )
    .join('\n\n')
}
