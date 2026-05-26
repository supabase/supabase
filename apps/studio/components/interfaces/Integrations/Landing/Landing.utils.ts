import { parseSchemaComment } from 'stripe-experiment-sync/supabase'

import { type WrapperMeta } from '../Wrappers/Wrappers.types'
import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { type IntegrationDefinition } from './Integrations.constants'
import {
  isInstalled as checkIsInstalled,
  findStripeSchema,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { type APIKey } from '@/data/api-keys/api-keys-query'
import { type DatabaseExtension } from '@/data/database-extensions/database-extensions-query'
import { type Schema } from '@/data/database/schemas-query'
import { type FDW } from '@/data/fdw/fdws-query'
import { type ProjectSecret } from '@/data/secrets/secrets-query'

export const isStripeSyncEngineInstalled = (schemas: Schema[]) => {
  const stripeSchema = findStripeSchema(schemas)
  const parsedSchema = parseSchemaComment(stripeSchema?.comment)
  return checkIsInstalled(parsedSchema.status)
}

export const isOAuthInstalled = ({
  integration,
  apiKeys,
  secrets,
}: {
  integration: IntegrationDefinition
  apiKeys: APIKey[]
  secrets: ProjectSecret[]
}) => {
  if (integration.installIdentificationMethod === 'secret_key_prefix') {
    const prefix = integration.secretKeyPrefix
    if (!prefix) return false

    return apiKeys.some((key) => key.type === 'secret' && key.name.startsWith(prefix))
  }

  if (integration.installIdentificationMethod === 'edge_function_secret_name') {
    const secretName = integration.edgeFunctionSecretName
    if (!secretName) return false

    return secrets.some((secret) => secret.name === secretName)
  }

  return false
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
