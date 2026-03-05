import type { ReactNode } from 'react'

import { MockRouterProvider } from '../router/MockRouterContext'
import type { SupaMockOrganization } from '../types'
import { MockProjectProvider } from './MockProjectContext'
import { MockUserProvider } from './MockUserContext'

interface MockProvidersProps {
  defaultPath: string
  projectName?: string
  organizationName?: string
  organizationPlan?: string
  branchName?: string
  organizations?: SupaMockOrganization[]
  children: ReactNode
}

export function MockProviders({
  defaultPath,
  projectName,
  organizationName,
  organizationPlan,
  branchName,
  organizations,
  children,
}: MockProvidersProps) {
  return (
    <MockRouterProvider defaultPath={defaultPath}>
      <MockProjectProvider
        projectName={projectName}
        organizationName={organizationName}
        organizationPlan={organizationPlan}
        branchName={branchName}
        organizations={organizations}
      >
        <MockUserProvider>{children}</MockUserProvider>
      </MockProjectProvider>
    </MockRouterProvider>
  )
}
