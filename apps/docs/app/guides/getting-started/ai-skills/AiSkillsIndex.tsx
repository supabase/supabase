import { getAiSkills } from './AiSkills.utils'
import { CopyButton } from './CopyButton'

export async function AiSkillsIndex() {
  let skills: Awaited<ReturnType<typeof getAiSkills>> = []

  try {
    skills = await getAiSkills()
  } catch {
    // Swallow errors from getAiSkills to keep the page usable
  }

  if (!skills.length) {
    return (
      <div className="not-prose text-sm text-foreground-lighter">
        Unable to load AI skills at the moment.
      </div>
    )
  }
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-default">
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">Skill</th>
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">Description</th>
            <th className="text-left py-2 text-foreground-lighter font-medium">Install command</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.name} className="border-b border-default">
              <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                <a
                  href={`https://github.com/supabase/agent-skills/tree/main/skills/${skill.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-brand transition-colors"
                >
                  {skill.name}
                </a>
              </td>
              <td className="py-3 pr-4 text-foreground-lighter">{skill.description}</td>
              <td className="w-px p-0">
                <div className="h-full max-w-xs overflow-x-auto flex items-center py-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <CopyButton text={skill.installCommand} />
                    <code className="font-mono text-xs text-foreground-lighter">
                      {skill.installCommand}
                    </code>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
