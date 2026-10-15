import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from 'ui'
import { ProjectSelector, type ProjectSelectorAuthState } from 'ui-patterns/ProjectSelector'

const organizations = [
  { slug: 'acme', name: 'Acme Inc' },
  { slug: 'globex', name: 'Globex Corporation' },
  { slug: 'initech', name: 'Initech' },
]

const projects = [
  { ref: 'qwertyuiopasdfghjklz', name: 'Marketing site', organizationSlug: 'acme' },
  { ref: 'mnbvcxzlkjhgfdsapoiu', name: 'Billing API', organizationSlug: 'acme' },
  {
    ref: 'zxcvbnmasdfghjklqwer',
    name: 'Legacy app',
    organizationSlug: 'acme',
    status: 'Paused',
    disabled: true,
  },
  { ref: 'poiuytrewqlkjhgfdsam', name: 'Analytics', organizationSlug: 'globex' },
  { ref: 'asdfghjklqwertyuiopz', name: 'Mobile backend', organizationSlug: 'globex' },
  { ref: 'lkjhgfdsamnbvcxzpoiu', name: 'TPS reports', organizationSlug: 'initech' },
]

type DemoState = ProjectSelectorAuthState | 'error'

export default function ProjectSelectorDemo() {
  const [state, setState] = useState<DemoState>('authenticated')
  const [projectRef, setProjectRef] = useState('')

  return (
    <div className="flex w-80 flex-col gap-4">
      <ToggleGroup
        type="single"
        size="sm"
        value={state}
        onValueChange={(value) => value && setState(value as DemoState)}
      >
        <ToggleGroupItem value="authenticated">Signed in</ToggleGroupItem>
        <ToggleGroupItem value="unauthenticated">Signed out</ToggleGroupItem>
        <ToggleGroupItem value="loading">Loading</ToggleGroupItem>
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
      </ToggleGroup>
      {/* Fixed height keeps the input in place when the signed-out and error hints appear */}
      <div className="h-20">
        <ProjectSelector
          value={projectRef}
          onValueChange={setProjectRef}
          organizations={organizations}
          projects={projects}
          authState={state === 'error' ? 'authenticated' : state}
          isError={state === 'error'}
          signInUrl="https://supabase.com/dashboard/sign-in"
        />
      </div>
      <p className="text-xs text-foreground-lighter">
        Value: <code className="text-foreground">{projectRef || '""'}</code>
      </p>
    </div>
  )
}
