import { CodeBlock } from 'ui-patterns/CodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const DEFAULT_SKILLS_COMMAND = 'npx skills add supabase/agent-skills'
const SERVER_SKILLS_COMMAND = 'npx skills add supabase/server'

function SkillsInstallContent({ state }: StepContentProps) {
  const skillsCommand = state.mode === 'server' ? SERVER_SKILLS_COMMAND : DEFAULT_SKILLS_COMMAND

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      wrapperClassName="lg:col-span-2"
      value={skillsCommand}
      hideLineNumbers
      language="bash"
    >
      {skillsCommand}
    </CodeBlock>
  )
}

export default SkillsInstallContent
