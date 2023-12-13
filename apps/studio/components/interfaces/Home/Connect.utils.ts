export const DATA = [
  {
    key: 'project_url',
    label: 'Project URL',
    value: 'https://vfdwrixrngvznobuouxs.supabase.red',
    description: `A RESTful endpoint for querying and managing your database. Put this in your .env file.`,
    type: 'info',
  },
  {
    key: 'anon_key',
    label: 'Anon key',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzd...',
    description:
      'This key is safe to use in a browser with Row Level Security enabled and policies configured.',
    type: 'info',
  },
  {
    key: 'service_key',
    label: 'Service key',
    value: 'eyehjGcaOiJIazI1NiIhetnetEHdeh3HEnCJ9.eyJpc3MiOiJzd...',
    description: `This key is used to access your database from a server environment. Do not expose this key publicly.`,
    type: 'warning',
  },
]

export const LIBS = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    files: [
      {
        name: '.env.local',
        content: `
NEXT_PUBLIC_SUPABASE_URL=your-project-url \nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`,
      },
      {
        name: 'page.tsx',
        content: `
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

  export default async function Notes() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);
    const { data: notes } = await supabase.from("notes").select();

    return <pre>{JSON.stringify(notes, null, 2)}</pre>
  }`,
      },
    ],
  },
  {
    key: 'react',
    label: 'React',
  },
  {
    key: 'vue',
    label: 'Vue',
  },
  {
    key: 'svelte',
    label: 'Svelte',
  },
  {
    key: 'angular',
    label: 'Angular',
  },
]
