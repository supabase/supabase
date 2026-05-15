import { describe, expect, test } from 'vitest'

import { getSchemaAsMarkdown, getTableDefinitionAsMarkdown } from './Schemas.utils'

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
})
