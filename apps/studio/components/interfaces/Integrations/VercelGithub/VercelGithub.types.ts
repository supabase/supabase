import { ReactNode } from 'react'

import {
  type IntegrationConnectionsCreateVariables,
  type IntegrationProjectConnection,
} from '@/data/integrations/integrations.types'

export interface Project {
  name: string
  ref: string
}

export interface ForeignProject {
  id: string
  name: string
  installation_id?: number
}

export interface ProjectLinkerProps {
  slug?: string
  organizationIntegrationId?: string
  foreignProjects: ForeignProject[]
  onCreateConnections: (variables: IntegrationConnectionsCreateVariables) => void
  installedConnections?: IntegrationProjectConnection[]
  isLoading?: boolean
  integrationIcon: ReactNode
  getForeignProjectIcon?: (project: ForeignProject) => ReactNode
  choosePrompt?: string
  onSkip?: () => void
  loadingForeignProjects?: boolean
  showNoEntitiesState?: boolean
  defaultSupabaseProject?: Project
  defaultForeignProjectId?: string
  mode: 'Vercel' | 'GitHub'
  variant?: 'default' | 'interstitial'
}
