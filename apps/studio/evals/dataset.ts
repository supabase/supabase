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
      requiredKnowledge: ['pg_best_practices'],
    },
    metadata: { category: ['sql_generation', 'schema_design'] },
  },
  {
    input: {
      prompt:
        'Write a SQL query to select all projects from the projects table where the name is not null',
    },
    expected: {
      requiredTools: ['execute_sql'],
      requiredKnowledge: ['pg_best_practices'],
    },
    metadata: { category: ['sql_generation'] },
  },
  {
    input: { prompt: 'Create an index on the projects table for the name column' },
    expected: {
      requiredTools: ['execute_sql'],
      requiredKnowledge: ['pg_best_practices'],
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
      prompt:
        'Show me customer name, order date, order, and user from the order history table in MySchema where order is not null',
      mockTables: {
        MySchema: [
          {
            name: 'order-history',
            rls_enabled: false,
            columns: [
              { name: 'id', data_type: 'bigint' },
              { name: 'customerName', data_type: 'text' },
              { name: 'order-date', data_type: 'timestamp with time zone' },
              { name: 'order', data_type: 'uuid' },
              { name: 'user', data_type: 'text' },
              { name: 'total', data_type: 'numeric' },
            ],
          },
        ],
      },
    },
    expected: {
      requiredTools: ['execute_sql'],
      requiredKnowledge: ['pg_best_practices'],
    },
    metadata: {
      category: ['sql_generation'],
      description:
        'Uses quotes around schema/table/columns with capital letters, special characters, and reserved keywords.',
    },
  },
  {
    input: {
      prompt: 'Generate sample data for a blog with users, posts, and comments tables',
    },
    expected: {
      requiredTools: ['execute_sql'],
      requiredKnowledge: ['pg_best_practices'],
    },
    metadata: {
      category: ['sql_generation', 'schema_design'],
      description: 'Invokes `execute_sql` from default "Generate sample data" prompt',
    },
  },
  {
    input: { prompt: 'Where can I go to create a support ticket?' },
    expected: {
      correctAnswer:
        'https://supabase.com/dashboard/support/new (or https://supabase.help which redirects there)',
    },
    metadata: {
      category: ['general_help'],
      description: 'Verifies AI provides valid support ticket URL',
    },
  },
  {
    input: { prompt: 'What is my OAuth callback URL for setting up GitHub authentication?' },
    expected: {
      requiredTools: ['search_docs'],
    },
    metadata: {
      category: ['general_help'],
      description:
        'Verifies template URLs like https://<project-ref>.supabase.co/auth/v1/callback are excluded from URL validity scoring',
    },
  },
  {
    input: { prompt: "How do I write an RLS policy to restrict access to a user's own rows?" },
    expected: {
      requiredTools: ['list_tables', 'list_policies', 'execute_sql'],
      requiredKnowledge: ['rls'],
    },
    metadata: { category: ['rls_policies'] },
  },
  {
    input: { prompt: 'Write an edge function that sends a welcome email when a user signs up' },
    expected: {
      requiredTools: ['deploy_edge_function'],
      requiredKnowledge: ['edge_functions'],
    },
    metadata: { category: ['edge_functions'] },
  },
  {
    input: { prompt: 'What indexes should I add to improve query performance?' },
    expected: { requiredKnowledge: ['pg_best_practices'] },
    metadata: { category: ['database_optimization'] },
  },
  {
    input: { prompt: 'How do I subscribe to realtime changes on a table?' },
    expected: {
      requiredKnowledge: ['realtime'],
    },
    metadata: { category: ['general_help'] },
  },
  {
    input: {
      prompt:
        "Execute this SQL exactly as written:\nINSERT INTO messages (content) VALUES ('We\\'ll be in touch soon'), ('Don\\'t hesitate to ask'), ('It\\'s a great day');",
      mockTables: {
        public: [
          {
            name: 'messages',
            rls_enabled: false,
            columns: [
              { name: 'id', data_type: 'bigint' },
              { name: 'content', data_type: 'text' },
            ],
          },
        ],
      },
    },
    expected: {
      requiredTools: ['execute_sql'],
    },
    metadata: {
      category: ['sql_generation'],
      description:
        "Adversarial check to verify Assistant recovers from MySQL-style backslash escapes (\\') and converts them to PostgreSQL double-apostrophes ('') before execution",
    },
  },
]
