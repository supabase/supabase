import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'

import { LOCAL_COMMANDS } from './GettingStarted.data'
import { FRAMEWORKS } from './GettingStarted.frameworks'
import { GettingStartedStepperClient } from './GettingStartedStepper.client'

// code blocks highlight on the server, so this component renders them for the client view
export const GettingStartedStepper = () => {
  const installCommands = [
    ...new Set(FRAMEWORKS.flatMap((framework) => (framework.install ? [framework.install] : []))),
  ]

  return (
    <GettingStartedStepperClient
      localCommandsCode={<CodeBlock contents={LOCAL_COMMANDS} lang="bash" />}
      installCodes={Object.fromEntries(
        installCommands.map((command) => [
          command,
          <CodeBlock key={command} contents={command} lang="bash" />,
        ])
      )}
    />
  )
}
