import { CodeBlock } from 'ui'

import type { StepContentProps } from '../../../Connect.types'

const ORM_INSTALL_COMMANDS: Record<string, string[]> = {
  prisma: ['npm install prisma --save-dev', 'npx prisma init'],
  drizzle: ['npm install drizzle-orm', 'npm install drizzle-kit --save-dev'],
}

function OrmInstallContent({ state }: StepContentProps) {
  const ormKey = String(state.orm ?? '')
  const commands = ORM_INSTALL_COMMANDS[ormKey]

  if (!commands?.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {commands.map((cmd, index) => (
        <CodeBlock
          key={index}
          className="[&_code]:text-foreground"
          wrapperClassName="lg:col-span-2"
          value={cmd}
          hideLineNumbers
          language="bash"
        >
          {cmd}
        </CodeBlock>
      ))}
    </div>
  )
}

export default OrmInstallContent
