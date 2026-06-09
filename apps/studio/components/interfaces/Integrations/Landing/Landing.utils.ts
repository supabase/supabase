import { parseSchemaComment } from 'stripe-experiment-sync/supabase'

import { type WrapperMeta } from '../Wrappers/Wrappers.types'
import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { type IntegrationDefinition } from './Integrations.constants'
import {
  isInstalled as checkIsInstalled,
  findStripeSchema,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { type DatabaseExtension } from '@/data/database-extensions/database-extensions-query'
import { type Schema } from '@/data/database/schemas-query'
import { type FDW } from '@/data/fdw/fdws-query'
import { type AuthorizedApp } from '@/data/oauth/authorized-apps-query'

export const isStripeSyncEngineInstalled = (schemas: Schema[]) => {
  const stripeSchema = findStripeSchema(schemas)
  const parsedSchema = parseSchemaComment(stripeSchema?.comment)
  return checkIsInstalled(parsedSchema.status)
}

export const isOAuthInstalled = ({
  integration,
  authorizedApps,
}: {
  integration: IntegrationDefinition
  authorizedApps: AuthorizedApp[]
}) => {
  const clientId = integration.oauthClientId
  if (!clientId) return false

  return authorizedApps.some((app) => app.client_id === clientId)
}

export const hasMatchingWrapper = ({ meta, wrappers }: { meta: WrapperMeta; wrappers: FDW[] }) => {
  return wrappers.find((w) => wrapperMetaComparator(meta, w))
}

export const hasRequiredExtensions = ({
  integration,
  extensions,
}: {
  integration: IntegrationDefinition
  extensions: DatabaseExtension[]
}) => {
  return integration.requiredExtensions.every((extName) => {
    const foundExtension = extensions.find((ext) => ext.name === extName)
    return !!foundExtension?.installed_version
  })
}
