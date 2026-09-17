import { Button } from 'ui'

import { ExplorerOnboardingLearnMore } from './ExplorerOnboardingLearnMore'
import { ExplorerHomePreference } from '@/components/interfaces/Account/Preferences/ExplorerHomePreference'
import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'

export const ExplorerOnboarding = () => {
  const { home, setHome, completeOnboarding, isReady } = useExplorerPreferences()

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto bg-surface-100 px-6">
      <div className="my-auto w-full max-w-xl shrink-0 space-y-8 py-12">
        <div className="space-y-3">
          <h1 className="heading-section">Welcome to Explorer</h1>
          <p className="text-sm leading-relaxed text-foreground-light">
            Interact with your database and logs in one place. Run SQL, chat with Assistant, or
            combine queries and notes in notebooks.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">Choose how Explorer opens</h2>
          <ExplorerHomePreference value={home} onValueChange={setHome} disabled={!isReady} />
        </div>

        <ExplorerOnboardingLearnMore />

        <Button variant="primary" onClick={completeOnboarding} disabled={!isReady}>
          Open Explorer
        </Button>
      </div>
    </div>
  )
}
