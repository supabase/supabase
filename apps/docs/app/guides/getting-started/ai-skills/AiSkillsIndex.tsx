import { getAiSkills } from './AiSkills.utils'
import { CopyButton } from './CopyButton'

export async function AiSkillsIndex() {
  const skills = await getAiSkills()

  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-default">
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">Skill</th>
            <th className="text-left py-2 pr-4 text-foreground-lighter font-medium">
              Description
            </th>
            <th className="text-right py-2 text-foreground-lighter font-medium">Install</th>
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
              <td className="py-3 text-right">
                <CopyButton text={skill.installCommand} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
