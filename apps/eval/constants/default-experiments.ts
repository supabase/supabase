export interface Experiment {
  id: string
  name: string
  userPrompt: string
  expectedOutcome: string
  results?: Record<string, any> // Results by model
  runningModels?: string[] // Which models are currently running
  errors?: Record<string, string> // Errors by model
  startTimes?: Record<string, number> // Start times by model
}

export const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: '1',
    name: 'Project Health Check',
    userPrompt:
      "Check the overall health of my Supabase project. Look for any recent errors, especially edge function errors in the last 24 hours, and provide details about what's causing them.",
    expectedOutcome:
      'Should use get_log_counts and get_logs tools to analyze system health, identify error patterns, provide specific error details with timestamps and reasons, and suggest actionable solutions for any issues found.',
  },
  {
    id: '2',
    name: 'RLS Policy Creation',
    userPrompt:
      "I have a 'posts' table with columns: id, title, content, author_id, created_at. Create RLS policies so users can only read and edit their own posts, but anyone can view published posts if there's a 'published' boolean column.",
    expectedOutcome:
      'Should create comprehensive RLS policies using proper Supabase patterns: enable RLS, use (select auth.uid()) for performance, separate policies for each operation (SELECT, INSERT, UPDATE, DELETE), proper role specifications (TO authenticated), and handle both private and public access scenarios.',
  },
  {
    id: '3',
    name: 'Edge Function Development',
    userPrompt:
      'Create an edge function that takes the last 10 messages from the messages table and uses OpenAI to summarize the messages in a concise paragraph',
    expectedOutcome: `
It should generate a function like the below, display the function using the display_edge_function tool, and then consicely explain the function and how it works.

\`\`\`ts
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialize OpenAI client
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Fetch last 10 messages from messages table
    const { data: messages, error } = await supabaseClient
      .from('messages')
      .select('created_at, content')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw new Error(\`Supabase error: \${error.message}\`)
    }

    if (!messages || messages.length === 0) {
      return new Response('No messages found to summarize', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Combine messages for summarization
    const messageContent = messages
      .map((msg, index) => \`\${index + 1}. \${msg.content}\`)
      .join('\n')

    // Create prompt for OpenAI
    const prompt = \`Summarize the following messages in a concise paragraph (100-150 words):
\${messageContent}\`

    // Get summary from OpenAI
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      stream: false,
    })

    const summary = chatCompletion.choices[0].message.content

    return new Response(summary, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })

  } catch (error) {
    return new Response(\`Error: \${error.message}\`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
})
\`\`\`
`,
  },
  {
    id: '4',
    name: 'Database Statistics Query',
    userPrompt:
      "I need to analyze user engagement. Create a query that shows monthly active users, total posts created per month, and average posts per user for the last 6 months. Assume I have 'profiles' and 'posts' tables.",
    expectedOutcome:
      'Should generate a complex SQL query using CTEs, window functions, date functions, JOINs, and aggregations. Should use display_query tool with appropriate visualization (chart view) and provide clear explanations of the metrics calculated.',
  },
  {
    id: '5',
    name: 'Complex Database Functions',
    userPrompt:
      "Create a database function that automatically updates a 'user_stats' table whenever a new post is created. The function should calculate total_posts, last_post_date, and avg_posts_per_month for the user. Include the necessary trigger.",
    expectedOutcome:
      'Should create a PostgreSQL function with proper security settings (security definer/invoker), search_path configuration, error handling, and a corresponding trigger. Should handle edge cases and provide proper indexing suggestions for performance.',
  },
  {
    id: '6',
    name: 'Authentication Setup',
    userPrompt:
      'Help me set up user authentication with a profiles table. I need to store additional user data like display_name, avatar_url, and bio. Also create the necessary RLS policies for the profiles table.',
    expectedOutcome:
      'Should create a public.profiles table linked to auth.users, enable RLS, create appropriate policies for profile management (users can read all profiles but only edit their own), and explain the auth.users relationship without suggesting direct access to auth schema.',
  },
  {
    id: '7',
    name: 'Performance Optimization',
    userPrompt:
      "My queries are slow. Check my database for performance issues and suggest optimizations. Also show me how to create indexes for a posts table that's frequently queried by author_id, created_at, and a full-text search on title and content.",
    expectedOutcome:
      'Should use get_advisors tool to check for performance issues, create appropriate indexes including composite indexes and full-text search indexes, explain index strategy, and provide performance monitoring suggestions using available tools.',
  },
  {
    id: '8',
    name: 'Real-time Subscriptions',
    userPrompt:
      'I want to set up real-time subscriptions for a chat application. Create the necessary tables for messages and channels, with proper RLS policies, and explain how to set up real-time subscriptions in the client.',
    expectedOutcome:
      'Should create properly structured tables with foreign keys and indexes, comprehensive RLS policies for chat security, enable real-time functionality, and provide clear guidance on client-side subscription setup with proper filtering.',
  },
]
