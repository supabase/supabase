import { type FDW } from 'data/fdw/fdws-query'
import { getDecryptedValues } from 'data/vault/vault-secret-decrypted-value-query'
import { INTEGRATIONS } from '../Integrations/Landing/Integrations.constants'
import { WrapperMeta } from '../Integrations/Wrappers/Wrappers.types'
import { convertKVStringArrayToJson } from '../Integrations/Wrappers/Wrappers.utils'

export const getDecryptedParameters = async ({
  ref,
  connectionString,
  wrapper,
}: {
  ref?: string
  connectionString?: string
  wrapper: FDW
}) => {
  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta
  const wrapperServerOptions = wrapperMeta.server.options

  const serverOptions = convertKVStringArrayToJson(wrapper?.server_options ?? [])

  const paramsToBeDecrypted = Object.fromEntries(
    new Map(
      Object.entries(serverOptions).filter(([key, value]) => {
        return wrapperServerOptions.find((option) => option.name === key)?.encrypted
      })
    )
  )

  const decryptedValues = await getDecryptedValues({
    projectRef: ref,
    connectionString: connectionString,
    ids: Object.values(paramsToBeDecrypted),
  })

  const paramsWithDecryptedValues = Object.fromEntries(
    new Map(
      Object.entries(paramsToBeDecrypted).map(([name, id]) => {
        const decryptedValue = decryptedValues[id]
        return [name, decryptedValue]
      })
    )
  )

  return {
    ...serverOptions,
    ...paramsWithDecryptedValues,
  }
}
