import { useState } from 'react'
import { ProjectSelector } from 'ui-patterns/ProjectSelector'

export default function ProjectSelectorSignedOut() {
  const [projectRef, setProjectRef] = useState('')

  return (
    <ProjectSelector
      className="w-80"
      value={projectRef}
      onValueChange={setProjectRef}
      organizations={[]}
      projects={[]}
      authState="unauthenticated"
      signInUrl="https://supabase.com/dashboard/sign-in"
    />
  )
}
