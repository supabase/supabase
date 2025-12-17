import { stripIndent } from 'common-tags'
import { AssistantEvalCase } from './scorer'

export const dataset: AssistantEvalCase[] = [
  {
    input: 'Hello!',
    expected: { textIncludes: 'Hi' },
    metadata: { category: ['other'] },
  },
  {
    input: 'How do I implement IP address rate limiting?',
    expected: { requiredTools: ['search_docs'] },
    metadata: { category: ['general_help'] },
  },
  {
    input: 'Check if my project is having issues right now and tell me what to fix first.',
    expected: {
      requiredTools: ['get_advisors', 'get_logs'],
      criteria: 'Response reflects there are RLS issues to fix.',
    },
    metadata: { category: ['debugging', 'rls_policies'] },
  },
  {
    input: 'Create a new table "foods" with columns for "name" and "color"',
    expected: {
      requiredTools: ['execute_sql'],
      sqlQuery: stripIndent`CREATE TABLE IF NOT EXISTS public.foods ( id bigserial PRIMARY KEY, name text NOT NULL, color text );`,
    },
    metadata: { category: ['sql_generation', 'schema_design'] },
  },
  {
    input:
      'Write a SQL query to select all products from the products table where the price is greater than 100',
    expected: {
      requiredTools: ['execute_sql'],
      sqlQuery: stripIndent`SELECT * FROM public.products WHERE price > 100;`,
    },
    metadata: { category: ['sql_generation'] },
  },
  {
    input: 'Create an index on the products table for the name column',
    expected: {
      requiredTools: ['execute_sql'],
      sqlQuery: stripIndent`CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);`,
    },
    metadata: { category: ['sql_generation', 'database_optimization'] },
  },
]
