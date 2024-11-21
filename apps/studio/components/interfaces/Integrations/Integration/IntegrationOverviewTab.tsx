import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'

import { Badge, Separator } from 'ui'
import { Admonition } from 'ui-patterns'
import { IntegrationDefinition } from '../Landing/Integrations.constants'
import { BuiltBySection } from './BuildBySection'
import { MarkdownContent } from './MarkdownContent'

export const IntegrationOverviewTab = ({
  integration,
  actions,
  children,
}: PropsWithChildren<{ integration: IntegrationDefinition; actions?: ReactNode }>) => {
  const router = useRouter()
  const isNativeIntegration = integration.type === 'postgres_extension'

  return (
    <div className="flex flex-col gap-8 py-10">
      <BuiltBySection integration={integration} />
      {actions}
      {isNativeIntegration && (
        <div className="px-10 max-w-4xl">
          <Admonition
            showIcon={false}
            type="default"
            className="[&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
          >
            <Badge className="bg-surface-300 bg-opacity-100 flex items-center gap-x-2 w-max">
              <img
                alt="Supabase"
                src={`${router.basePath}/img/supabase-logo.svg`}
                className=" h-2.5 cursor-pointer rounded"
              />
              <span>Native Integration</span>
            </Badge>
            <p className="text-foreground-light">
              This integration manages extensions directly in your Postgres database
            </p>
          </Admonition>
        </div>
      )}
      <MarkdownContent key={integration.id} integrationId={integration.id} />
      <Separator />
      {children}
    </div>
  )
}
