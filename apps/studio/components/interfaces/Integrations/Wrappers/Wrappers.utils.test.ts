import { describe, expect, it } from 'vitest'

import { SUPABASE_TARGET_SCHEMA_OPTION, WRAPPER_HANDLERS, WRAPPERS } from './Wrappers.constants'
import { Table } from './Wrappers.types'
import {
  getEditionFormSchema,
  getTableFormSchema,
  getWrapperCreationFormSchema,
} from './Wrappers.utils'

const stripe_wrapper = {
  name: 'stripe_wrapper',
  handlerName: WRAPPER_HANDLERS.STRIPE,
  validatorName: 'stripe_fdw_validator',
  icon: '',
  description: 'Payment processing and subscription management',
  extensionName: 'StripeFdw',
  label: 'Stripe',
  docsUrl: '',
  server: {
    options: [
      {
        name: 'api_key_id',
        label: 'Stripe Secret Key',
        required: true,
        encrypted: true,
        secureEntry: true,
        urlHelper: 'https://stripe.com/docs/keys',
      },
      {
        name: 'api_url',
        label: 'Stripe API URL',
        defaultValue: 'https://api.stripe.com/v1',
        required: false,
        encrypted: false,
        secureEntry: false,
      },
      SUPABASE_TARGET_SCHEMA_OPTION,
    ],
  },
  tables: [],
}

describe('getWrapperCreationFormSchema', () => {
  it('should build a schema that validates tables mode', () => {
    const schema = getWrapperCreationFormSchema(stripe_wrapper)
    const result = schema.safeParse({ mode: 'tables' })

    expect(result.success).toEqual(false)
    // Common required field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'wrapper_name'))
    ).toBeDefined()
    // Table mode specific field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'tables'))
    ).toBeDefined()
  })

  it('should build a schema that validates schema mode', () => {
    const schema = getWrapperCreationFormSchema(stripe_wrapper)
    const result = schema.safeParse({ mode: 'schema' })

    expect(result.success).toEqual(false)
    // Common required field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'wrapper_name'))
    ).toBeDefined()
    // Schema mode specific field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'source_schema'))
    ).toBeDefined()
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'target_schema'))
    ).toBeDefined()
  })

  it('should build a schema that validates wrapper specific options', () => {
    const schema = getWrapperCreationFormSchema(stripe_wrapper)
    const result = schema.safeParse({ mode: 'tables' })
    expect(result.success).toEqual(false)
    // Required option
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'api_key_id'))
    ).toBeDefined()
    // Optional option
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'api_url'))
    ).toBeUndefined()
  })
})

describe('getEditionFormSchema', () => {
  it('should build a schema that validates wrapper specific options', () => {
    const schema = getEditionFormSchema(stripe_wrapper)
    const result = schema.safeParse({ mode: 'tables' })
    expect(result.success).toEqual(false)
    // Common required field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'wrapper_name'))
    ).toBeDefined()
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'tables'))
    ).toBeDefined()
    // Required option
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'api_key_id'))
    ).toBeDefined()
    // Optional option
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'api_url'))
    ).toBeUndefined()
  })
})

describe('getTableFormSchema', () => {
  const table_schema = {
    label: 'Accounts',
    description: 'List of accounts on your Stripe account',
    availableColumns: [
      {
        name: 'id',
        type: 'text',
      },
      {
        name: 'business_type',
        type: 'text',
      },
      {
        name: 'country',
        type: 'text',
      },
      {
        name: 'email',
        type: 'text',
      },
      {
        name: 'type',
        type: 'text',
      },
      {
        name: 'created',
        type: 'timestamp',
      },
      {
        name: 'attrs',
        type: 'jsonb',
      },
    ],
    options: [
      {
        name: 'object',
        defaultValue: 'accounts',
        editable: false,
        required: true,
        type: 'text',
      },
      {
        name: 'rowid_column',
        label: 'Row ID Column',
        defaultValue: 'id',
        editable: true,
        required: false,
        type: 'text',
      },
    ],
  } satisfies Table

  it('should build a schema that validates tables with existing schema', () => {
    const schema = getTableFormSchema(table_schema)
    const result = schema.safeParse({})
    expect(result.success).toEqual(false)
    // Common required field
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'table_name'))
    ).toBeDefined()
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'schema'))
    ).toBeDefined()
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'columns'))
    ).toBeDefined()
    // Required options
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'object'))
    ).toBeDefined()
    // Optional options
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'rowid_column'))
    ).toBeUndefined()
  })

  it('should build a schema that validates tables with custom schema', () => {
    const schema = getTableFormSchema(table_schema)
    // Because the schema_name is validated in zod superRefine, the normal validation
    // must have succeeded first
    const result = schema.safeParse({
      table_name: 'test',
      schema: 'custom',
      columns: [],
      object: 'acounts',
    })

    expect(result.success).toEqual(false)
    expect(
      result.error?.issues.find((issue) => issue.path.some((p) => p === 'schema_name'))
    ).toBeDefined()
  })
})
