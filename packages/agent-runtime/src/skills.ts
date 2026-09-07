import { tool, type Tool } from 'ai'
import { z } from 'zod'

export interface AgentSkill {
  readonly name: string
  readonly description: string
  readonly load: () => string | Promise<string>
}

export interface SkillCatalog {
  instructions: (toolName?: string) => string
  tool: Tool<{ name: string }, string>
}

/** Registers skill descriptions without loading their instructions. */
export function createSkillCatalog(skills: readonly AgentSkill[]): SkillCatalog {
  if (skills.length === 0) {
    throw new Error('A skill catalog requires at least one skill.')
  }

  const catalog = new Map<string, AgentSkill>()
  for (const { name, description, load } of skills) {
    if (name.trim() !== name || !/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
      throw new Error(
        `Invalid skill name "${name}". Use lowercase letters, numbers, underscores, or hyphens, starting with a letter or number.`
      )
    }
    if (catalog.has(name)) {
      throw new Error(`Skill "${name}" already exists. Choose a unique name.`)
    }
    if (description.trim().length === 0) {
      throw new Error(`Skill "${name}" requires a description.`)
    }
    catalog.set(name, { name, description, load })
  }

  const names = [...catalog.keys()] as [string, ...string[]]

  return {
    instructions: (toolName = 'load_skill') =>
      [
        'Available skills',
        `Call \`${toolName}\` with a skill name to load its instructions before working on a matching task.`,
        ...[...catalog.values()].map(({ name, description }) => `- ${name}: ${description}`),
      ].join('\n'),
    tool: tool({
      description: 'Load instructions for an available skill before working on a matching task.',
      inputSchema: z.object({
        name: z.enum(names).describe('The name of the skill to load'),
      }),
      execute: async ({ name }) => {
        const skill = catalog.get(name)
        if (skill === undefined) {
          throw new Error(
            `Unknown skill "${name}". Choose an available skill: ${names.join(', ')}.`
          )
        }
        return skill.load()
      },
    }),
  }
}
