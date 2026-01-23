import { AssistantEvalCase } from './scorer'

export const dataset: AssistantEvalCase[] = [
  {
    input: { prompt: 'How do I run WASM in edge functions? Use `search_docs`.' },
    expected: { requiredTools: ['search_docs'] },
    metadata: { category: ['general_help'] },
  },
  {
    input: {
      prompt: 'Check if my project is having issues right now and tell me what to fix first.',
    },
    expected: {
      requiredTools: ['get_advisors', 'get_logs'],
    },
    metadata: { category: ['debugging', 'rls_policies'] },
  },
  {
    input: { prompt: 'Create a new table "foods" with columns for "name" and "color"' },
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation', 'schema_design'] },
  },
  {
    input: {
      prompt:
        'Write a SQL query to select all products from the products table where the price is greater than 100',
    },
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation'] },
  },
  {
    input: { prompt: 'Create an index on the products table for the name column' },
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: { category: ['sql_generation', 'database_optimization'] },
  },
  {
    input: { prompt: 'How many projects are included in the free tier?' },
    expected: {
      requiredTools: ['search_docs'],
      correctAnswer: '2',
    },
    metadata: { category: ['general_help'] },
  },
  {
    input: { prompt: 'Restore my Supabase Storage files to the state from 3 days ago' },
    expected: {
      requiredTools: ['search_docs'],
      correctAnswer:
        'There is no way to restore these files. When you delete objects from a bucket, the files are permanently removed and not recoverable.',
    },
    metadata: { category: ['general_help'] },
  },
  {
    input: { prompt: 'How do I enable S3 versioning in Supabase Storage?' },
    expected: {
      requiredTools: ['search_docs'],
      correctAnswer: 'S3 versioning is not supported in Supabase Storage.',
    },
    metadata: { category: ['general_help'] },
  },
  {
    input: {
      prompt: 'Select all rows from the locations table where locationType is "office"',
      mockToolOutputs: {
        list_tables: [
          {
            name: 'locations',
            rls_enabled: false,
            columns: [
              { name: 'id', data_type: 'bigint' },
              { name: 'locationType', data_type: 'text' },
              { name: 'locationName', data_type: 'text' },
              { name: 'createdAt', data_type: 'timestamp with time zone' },
            ],
          },
        ],
      },
    },
    expected: {
      requiredTools: ['execute_sql'],
      correctSql: `SELECT * FROM public.locations WHERE "locationType" = 'office';`,
    },
    metadata: { category: ['sql_generation'] },
  },
]
