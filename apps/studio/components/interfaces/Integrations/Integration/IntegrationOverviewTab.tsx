import { PropsWithChildren, ReactNode } from 'react'

import { Separator } from 'ui'
import { IntegrationDefinition } from '../Landing/Integrations.constants'
import { BuiltBySection } from './build-by-section'
import { MarkdownContent } from './MarkdownContent'

export const IntegrationOverviewTab = ({
  integration,
  actions,
  children,
}: PropsWithChildren<{ integration: IntegrationDefinition; actions?: ReactNode }>) => {
  return (
    <div className="my-10 flex flex-col gap-10">
      <BuiltBySection integration={integration} />
      {actions}
      <MarkdownContent key={integration.id} integrationId={integration.id} />
      <Separator />
      {children}
    </div>
  )
}
