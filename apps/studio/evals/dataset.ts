import { AssistantEvalCase } from './scorer'

export const dataset: AssistantEvalCase[] = [
  {
    input: 'How do I run WASM in edge functions? Use `search_docs`.',
    expected: { requiredTools: ['search_docs'] },
    metadata: { category: ['general_help'] },
  },
  {
    input: 'Check if my project is having issues right now and tell me what to fix first.',
    expected: {
      requiredTools: ['get_advisors', 'get_logs'],
    },
    metadata: { category: ['debugging', 'rls_policies'] },
  },
  {
    input: 'Create a new table "foods" with columns for "name" and "color"',
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation', 'schema_design'] },
  },
  {
    input:
      'Write a SQL query to select all products from the products table where the price is greater than 100',
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation'] },
  },
  {
    input: 'Create an index on the products table for the name column',
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation', 'database_optimization'] },
  },
]
