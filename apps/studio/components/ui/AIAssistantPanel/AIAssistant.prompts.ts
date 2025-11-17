export const defaultPrompts = [
  {
    title: 'Create a back-end',
    prompt:
      'Create a messaging app with users, messages, and an edge function that uses OpenAI to summarize message threads.',
  },
  {
    title: 'Health check',
    prompt: 'Can you check if my database and edge functions are healthy?',
  },
  {
    title: 'Query your data',
    prompt: 'Give me a list of new users from the auth.users table who signed up in the past week',
  },
  {
    title: 'Set up RLS policies',
    prompt: 'Create RLS policies to ensure users can only access their own data',
  },
  {
    title: 'Create a function',
    prompt: 'Create an edge function that summarises the contents of a table row using OpenAI',
  },
  {
    title: 'Generate sample data',
    prompt: 'Generate sample data for a blog with users, posts, and comments tables',
  },
]

export const codeSnippetPrompts = [
  {
    title: 'Explain code',
    prompt: 'Explain what this code does and how it works',
  },
  {
    title: 'Improve code',
    prompt: 'How can I improve this code for better performance and readability?',
  },
  {
    title: 'Debug issues',
    prompt: 'Help me debug any potential issues with this code',
  },
]
