import { ContentListings } from '~/components/ContentListings/ContentListings.client'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import { isFeatureEnabled } from 'common/enabled-features'

import { LOCAL_COMMANDS } from './GettingStarted.data'
import { FRAMEWORKS } from './GettingStarted.frameworks'
import {
  GettingStartedStepperClient,
  GettingStartedVariantSwitch,
} from './GettingStartedStepper.client'

// code blocks highlight on the server, so this component renders them for the client view
export const GettingStartedStepper = () => {
  const installCommands = [
    ...new Set(FRAMEWORKS.flatMap((framework) => (framework.install ? [framework.install] : []))),
  ]

  return (
    <GettingStartedVariantSwitch
      // the page before the stepper, kept for the docs-getting-started-v2 experiment
      control={
        <>
          <ContentListings id="getting-started-overview" />
          <ContentListings id="getting-started-use-cases" />
          {isFeatureEnabled('docs:framework_quickstarts') ? (
            <ContentListings id="getting-started-framework-quickstarts" />
          ) : null}
          {isFeatureEnabled('docs:web_apps') ? (
            <ContentListings id="getting-started-web-app-demos" />
          ) : null}
          {isFeatureEnabled('docs:mobile_tutorials') ? (
            <ContentListings id="getting-started-mobile-tutorials" />
          ) : null}
        </>
      }
    >
      <GettingStartedStepperClient
        localCommandsCode={<CodeBlock contents={LOCAL_COMMANDS} lang="bash" />}
        installCodes={Object.fromEntries(
          installCommands.map((command) => [
            command,
            <CodeBlock key={command} contents={command} lang="bash" />,
          ])
        )}
      />
    </GettingStartedVariantSwitch>
  )
}
