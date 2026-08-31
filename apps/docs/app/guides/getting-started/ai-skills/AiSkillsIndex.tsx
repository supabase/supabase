import { CodeBlock } from 'ui-patterns/CodeBlock'
import Heading from 'ui/src/components/CustomHTMLElements/Heading'

import { getAiSkills } from './AiSkills.utils'

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
    <>
      {skills.map((skill) => (
        <div key={skill.name}>
          <Heading tag="h3">{skill.name}</Heading>
          <p>{skill.description}</p>
          <CodeBlock language="bash" className="language-bash">
            {skill.installCommand}
          </CodeBlock>
        </div>
      ))}
    </>
  )
}
