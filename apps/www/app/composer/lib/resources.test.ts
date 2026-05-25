import { describe, expect, it } from 'vitest'

import { mergeTemplates } from './composer'
import { extractComposerResources } from './resources'
import type { Template } from './templates'

function extractFromTemplates(templates: Template[]) {
  const mergeResult = mergeTemplates(templates)

  return extractComposerResources({ templates, mergeResult })
}

describe('project composer resources', () => {
  it('creates one config resource per top-level TOML section', () => {
    const template: Template = {
      id: 'config',
      name: 'Config',
      description: 'Config template',
      category: 'Core',
      files: [
        {
          path: 'supabase/config.toml',
          content: `[api]
enabled = true

[auth]
enabled = true

[storage]
enabled = true
`,
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'config:api', kind: 'config', label: 'api' }),
        expect.objectContaining({ id: 'config:auth', kind: 'config', label: 'auth' }),
        expect.objectContaining({ id: 'config:storage', kind: 'config', label: 'storage' }),
      ])
    )
  })

  it('extracts schemas from config and the default database schema', () => {
    const template: Template = {
      id: 'database',
      name: 'Database',
      description: 'Database template',
      category: 'Core',
      files: [
        {
          path: 'supabase/config.toml',
          content: `[db]
enabled = true

[api]
schemas = ["public", "graphql_public"]
`,
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'schema:public', kind: 'schema', label: 'public' }),
        expect.objectContaining({
          id: 'schema:graphql_public',
          kind: 'schema',
          label: 'graphql_public',
        }),
      ])
    )
  })

  it('extracts table resources from SQL files', () => {
    const template: Template = {
      id: 'billing',
      name: 'Billing',
      description: 'Billing template',
      category: 'Database',
      files: [
        {
          path: 'supabase/schemas/billing.sql',
          content: `create table if not exists public.billing_events (
  id text primary key
);
`,
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'table:public.billing_events',
          kind: 'table',
          label: 'billing_events',
          schema: 'public',
          sourceFilePath: 'supabase/schemas/billing.sql',
          sourceTemplateIds: ['billing'],
        }),
      ])
    )
  })

  it('extracts schema resources from SQL files', () => {
    const template: Template = {
      id: 'stripe',
      name: 'Stripe',
      description: 'Stripe schema template',
      category: 'Database',
      files: [
        {
          path: 'supabase/schemas/stripe.sql',
          content: 'create schema if not exists stripe;\n',
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'schema:stripe', kind: 'schema', label: 'stripe' }),
      ])
    )
  })

  it('extracts edge functions from function file paths', () => {
    const template: Template = {
      id: 'functions-stripe-webhook',
      name: 'Stripe Webhook',
      description: 'Stripe webhook function',
      category: 'Ecommerce',
      files: [
        {
          path: 'supabase/functions/stripe-webhook/index.ts',
          content: 'Deno.serve(() => Response.json({ ok: true }))\n',
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual([
      expect.objectContaining({
        id: 'edge-function:stripe-webhook',
        kind: 'edge-function',
        label: 'stripe-webhook',
        sourceFilePath: 'supabase/functions/stripe-webhook/index.ts',
      }),
    ])
  })

  it('extracts storage buckets from storage bucket inserts', () => {
    const template: Template = {
      id: 'storage-avatars',
      name: 'Avatars',
      description: 'Avatar bucket',
      category: 'Storage',
      files: [
        {
          path: 'supabase/schemas/storage.sql',
          content: `insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
`,
        },
      ],
    }

    expect(extractFromTemplates([template])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'bucket:avatars', kind: 'bucket', label: 'avatars' }),
      ])
    )
  })

  it('merges duplicate resources with multiple source templates', () => {
    const first: Template = {
      id: 'first',
      name: 'First',
      description: 'First table template',
      category: 'Database',
      files: [
        {
          path: 'supabase/schemas/app.sql',
          content: 'create table if not exists public.todos (id bigint primary key);\n',
        },
      ],
    }
    const second: Template = {
      id: 'second',
      name: 'Second',
      description: 'Second table template',
      category: 'Database',
      files: [
        {
          path: 'supabase/schemas/app.sql',
          content: 'create table if not exists public.todos (id bigint primary key);\n',
        },
      ],
    }

    expect(extractFromTemplates([first, second])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'schema:public',
          sourceTemplateIds: ['first', 'second'],
        }),
        expect.objectContaining({
          id: 'table:public.todos',
          sourceTemplateIds: ['first', 'second'],
        }),
      ])
    )
  })
})
