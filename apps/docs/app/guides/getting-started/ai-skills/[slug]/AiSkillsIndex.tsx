import Link from 'next/link'
import { GlassPanel } from 'ui-patterns'
import { getAiSkills } from './AiSkills.utils'

export async function AiSkillsIndex() {
  const skills = await getAiSkills()

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 not-prose">
      {skills.map((skill) => (
        <Link
          key={skill.filename}
          href={`/guides/getting-started/ai-skills/${skill.filename}`}
          passHref
        >
          <GlassPanel
            title={skill.heading ?? skill.filename.replaceAll('-', ' ')}
            hasLightIcon
          >
            {skill.metadata?.description && (
              <p className="text-sm text-foreground-lighter">
                {skill.metadata.description}
              </p>
            )}
          </GlassPanel>
        </Link>
      ))}
    </div>
  )
}
