import { describe, expect, test } from 'vitest'

import {
  getEnumsAsMarkdown,
  getPoliciesAsMarkdown,
  getSchemaAsMarkdown,
  getTableDefinitionAsMarkdown,
} from './Schemas.utils'

describe('Schemas.utils', () => {
  test('getSchemaAsMarkdown returns properly formatted markdown', () => {
    const schema = 'public'
    const tables = [
      {
        ref: 'default',
        id: 20999,
        name: 'test',
        description: 'An excellent description',
        schema: 'public',
        isForeign: false,
        columns: [
          {
            id: '20999.1',
            isPrimary: true,
            name: 'id',
            format: 'int8',
            isNullable: false,
            isUnique: false,
            isUpdateable: true,
            isIdentity: true,
            description: '',
          },
          {
            id: '20999.2',
            isPrimary: false,
            name: 'created_at',
            format: 'timestamptz',
            isNullable: false,
            isUnique: false,
            isUpdateable: true,
            isIdentity: false,
            description: '',
          },
          {
            id: '20999.3',
            isPrimary: false,
            name: 'user_id',
            format: 'uuid',
            isNullable: true,
            isUnique: false,
            isUpdateable: true,
            isIdentity: false,
            description: '',
          },
        ],
      },
      {
        ref: 'default',
        id: 21049,
        name: 'test2',
        description: '',
        schema: 'public',
        isForeign: false,
        columns: [
          {
            id: '21049.1',
            isPrimary: true,
            name: 'id',
            format: 'int8',
            isNullable: false,
            isUnique: false,
            isUpdateable: true,
            isIdentity: true,
            description: '',
          },
          {
            id: '21049.2',
            isPrimary: false,
            name: 'created_at',
            format: 'timestamptz',
            isNullable: false,
            isUnique: false,
            isUpdateable: true,
            isIdentity: false,
            description: '',
          },
        ],
      },
      {
        id: 21009,
        ref: 'default',
        schema: 'auth',
        name: 'auth.users.id',
        description: '',
        isForeign: true,
        columns: [],
      },
    ]
    const result = getSchemaAsMarkdown(schema, tables)
    expect(result).toBe(`## Table \`test\`

An excellent description

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| \`id\` | \`int8\` | Primary Identity |
| \`created_at\` | \`timestamptz\` |  |
| \`user_id\` | \`uuid\` |  Nullable |

## Table \`test2\`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| \`id\` | \`int8\` | Primary Identity |
| \`created_at\` | \`timestamptz\` |  |

`)
  })
  test('getTableDefinitionAsMarkdown returns properly formatted markdown', () => {
    const table = {
      ref: 'default',
      id: 20999,
      name: 'test',
      description: 'An excellent description',
      schema: 'public',
      isForeign: false,
      columns: [
        {
          id: '20999.1',
          isPrimary: true,
          name: 'id',
          format: 'int8',
          isNullable: false,
          isUnique: false,
          isUpdateable: true,
          isIdentity: true,
          description: '',
        },
        {
          id: '20999.2',
          isPrimary: false,
          name: 'created_at',
          format: 'timestamptz',
          isNullable: false,
          isUnique: false,
          isUpdateable: true,
          isIdentity: false,
          description: '',
        },
        {
          id: '20999.3',
          isPrimary: false,
          name: 'user_id',
          format: 'uuid',
          isNullable: true,
          isUnique: false,
          isUpdateable: true,
          isIdentity: false,
          description: '',
        },
      ],
    }
    const result = getTableDefinitionAsMarkdown(table)
    expect(result).toBe(`## Table \`test\`

An excellent description

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| \`id\` | \`int8\` | Primary Identity |
| \`created_at\` | \`timestamptz\` |  |
| \`user_id\` | \`uuid\` |  Nullable |
`)
  })

  test('getEnumsAsMarkdown returns formatted enum section', () => {
    const enums = [
      { name: 'order_status', schema: 'public', enums: ['pending', 'processing', 'shipped'] },
      { name: 'role_type', schema: 'public', enums: ['admin', 'user'] },
      { name: 'other_enum', schema: 'auth', enums: ['a', 'b'] },
    ]
    const result = getEnumsAsMarkdown('public', enums)
    expect(result).toBe(`## Custom Types / Enums

### \`order_status\`

\`pending\` | \`processing\` | \`shipped\`

### \`role_type\`

\`admin\` | \`user\`

`)
  })

  test('getEnumsAsMarkdown returns empty string when no enums match schema', () => {
    const enums = [{ name: 'other_enum', schema: 'auth', enums: ['a', 'b'] }]
    const result = getEnumsAsMarkdown('public', enums)
    expect(result).toBe('')
  })

  test('getPoliciesAsMarkdown returns formatted policy table grouped by table', () => {
    const policies = [
      {
        name: 'users_select',
        schema: 'public',
        table: 'users',
        command: 'SELECT',
        roles: ['authenticated'],
        action: 'PERMISSIVE',
        definition: 'auth.uid() = id',
        check: null,
      },
      {
        name: 'users_insert',
        schema: 'public',
        table: 'users',
        command: 'INSERT',
        roles: ['authenticated'],
        action: 'PERMISSIVE',
        definition: null,
        check: 'auth.uid() = id',
      },
    ]
    const result = getPoliciesAsMarkdown('public', policies)
    expect(result).toContain('## RLS Policies')
    expect(result).toContain('### `users`')
    expect(result).toContain('`users_select`')
    expect(result).toContain('`users_insert`')
    expect(result).toContain('`auth.uid() = id`')
    expect(result).toContain('—')
  })

  test('getPoliciesAsMarkdown returns empty string when no policies match schema', () => {
    const policies = [
      {
        name: 'test',
        schema: 'auth',
        table: 'users',
        command: 'SELECT',
        roles: ['anon'],
        action: 'PERMISSIVE',
        definition: 'true',
        check: null,
      },
    ]
    const result = getPoliciesAsMarkdown('public', policies)
    expect(result).toBe('')
  })
})
