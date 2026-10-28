import { describe, expect, it } from 'vitest'

import { formatPolicySummary, formatTriggerSummary, getTableRelationships } from './Details.utils'

const fk = (
  constraint_name: string,
  [source_schema, source_table_name, source_column_name]: [string, string, string],
  [target_table_schema, target_table_name, target_column_name]: [string, string, string]
) => ({
  constraint_name,
  source_schema,
  source_table_name,
  source_column_name,
  target_table_schema,
  target_table_name,
  target_column_name,
})

describe('getTableRelationships', () => {
  const orders = { schema: 'public', name: 'orders' }

  it('separates the tables this one points at from the tables that point at it', () => {
    const { references, referencedBy } = getTableRelationships(
      [
        fk('orders_user_id_fkey', ['public', 'orders', 'user_id'], ['auth', 'users', 'id']),
        fk('items_order_id_fkey', ['public', 'items', 'order_id'], ['public', 'orders', 'id']),
        fk('unrelated_fkey', ['public', 'a', 'b_id'], ['public', 'b', 'id']),
      ],
      orders
    )
    expect(references).toEqual([
      {
        constraintName: 'orders_user_id_fkey',
        table: { schema: 'auth', name: 'users' },
        columns: ['user_id'],
        otherColumns: ['id'],
      },
    ])
    expect(referencedBy).toEqual([
      {
        constraintName: 'items_order_id_fkey',
        table: { schema: 'public', name: 'items' },
        columns: ['id'],
        otherColumns: ['order_id'],
      },
    ])
  })

  it('shows a composite foreign key as one relationship, not one per column', () => {
    const { references } = getTableRelationships(
      [
        fk('orders_tenant_fkey', ['public', 'orders', 'tenant_id'], ['public', 'tenants', 'id']),
        fk('orders_tenant_fkey', ['public', 'orders', 'region'], ['public', 'tenants', 'region']),
      ],
      orders
    )
    expect(references).toHaveLength(1)
    expect(references[0].columns).toEqual(['tenant_id', 'region'])
  })

  it('lists a self-reference once, as something the table references', () => {
    const { references, referencedBy } = getTableRelationships(
      [fk('orders_parent_fkey', ['public', 'orders', 'parent_id'], ['public', 'orders', 'id'])],
      orders
    )
    expect(references).toHaveLength(1)
    expect(referencedBy).toHaveLength(0)
  })
})

describe('summaries', () => {
  it('describes who a policy applies to, flagging restrictive ones', () => {
    expect(
      formatPolicySummary({
        command: 'SELECT',
        roles: ['anon', 'authenticated'],
        action: 'PERMISSIVE',
      })
    ).toBe('Select · anon, authenticated')
    expect(formatPolicySummary({ command: 'ALL', roles: ['public'], action: 'RESTRICTIVE' })).toBe(
      'All commands · public · Restrictive'
    )
  })

  it('describes when a trigger fires and what it calls', () => {
    expect(
      formatTriggerSummary({
        activation: 'BEFORE',
        events: ['INSERT', 'UPDATE'],
        function_schema: 'public',
        function_name: 'set_updated_at',
      })
    ).toBe('Before insert or update · public.set_updated_at()')
  })
})
