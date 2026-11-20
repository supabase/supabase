import { describe, expect, it } from 'vitest'

import { PROVIDERS_SCHEMAS } from './AuthProvidersFormValidation'

const URL_FIELDS = [
  {
    title: 'Azure',
    values: {
      EXTERNAL_AZURE_ENABLED: true,
      EXTERNAL_AZURE_CLIENT_ID: 'client-id',
      EXTERNAL_AZURE_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_AZURE_URL',
  },
  {
    title: 'GitLab',
    values: {
      EXTERNAL_GITLAB_ENABLED: true,
      EXTERNAL_GITLAB_CLIENT_ID: 'client-id',
      EXTERNAL_GITLAB_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_GITLAB_URL',
  },
  {
    title: 'KeyCloak',
    values: {
      EXTERNAL_KEYCLOAK_ENABLED: true,
      EXTERNAL_KEYCLOAK_CLIENT_ID: 'client-id',
      EXTERNAL_KEYCLOAK_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_KEYCLOAK_URL',
  },
  {
    title: 'WorkOS',
    values: {
      EXTERNAL_WORKOS_ENABLED: true,
      EXTERNAL_WORKOS_CLIENT_ID: 'client-id',
      EXTERNAL_WORKOS_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_WORKOS_URL',
  },
  {
    title: 'SAML 2.0',
    values: { SAML_ENABLED: true },
    urlKey: 'SAML_EXTERNAL_URL',
  },
]

const getValidationSchema = (title: string) => {
  const schema = PROVIDERS_SCHEMAS.find((provider) => provider.title === title)?.validationSchema
  if (!schema) {
    throw new Error(`No validation schema for ${title}`)
  }

  return schema
}

describe('AuthProvidersFormValidation: provider URL fields', () => {
  it.each(URL_FIELDS)('$title trims surrounding whitespace from the URL', (field) => {
    const result = getValidationSchema(field.title).safeParse({
      ...field.values,
      [field.urlKey]: '  https://auth.example.com/realms/main  ',
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ [field.urlKey]: 'https://auth.example.com/realms/main' })
  })

  it.each(URL_FIELDS)('$title rejects a URL with an interior space', (field) => {
    const result = getValidationSchema(field.title).safeParse({
      ...field.values,
      [field.urlKey]: 'https://auth.example.com/realms/my realm',
    })

    expect(result.success).toBe(false)
  })
})
