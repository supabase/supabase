'use client'

import { type Metadata } from 'next'
import Link from 'next/link'
import {
  Sandpack,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react'
import { cn } from 'ui'
import { ReactNode } from 'react'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

import HomeLayout from '~/layouts/HomeLayout'
import { BASE_PATH } from '~/lib/constants'
import { Toc, TOCItems, TOCScrollArea } from 'ui-patterns/Toc'
import { useTheme } from 'next-themes'
import { SandpackToggle } from '~/components/SandpackToggle'
import { Terminal } from 'lucide-react'

// export const metadata: Metadata = {
//   title: 'Supabase UI Blocks - Ready-to-use components for your app',
//   description:
//     'Copy and paste production-ready UI components powered by Supabase to enhance your application',
//   alternates: {
//     canonical: `${BASE_PATH}/blocks`,
//   },
// }

interface Subsection {
  id: string
  title: string
  description: string
  installCommand: string
  showPreview: boolean
  body?: ReactNode | string
  code?: {
    [filename: string]: string
  }
}

interface Section {
  id: string
  title: string
  body?: ReactNode | string
  useTabs?: boolean
  subsections: Subsection[]
}

const sections: Record<string, Section> = {
  clients: {
    id: 'clients',
    title: 'Clients',
    useTabs: true,
    body: 'Supabase provides official client libraries for multiple frameworks and platforms. Choose your preferred client library to get started.',
    subsections: [
      {
        id: 'react',
        title: 'React',
        description: 'Integration with React applications',
        installCommand: 'npm install @supabase/supabase-js',
        showPreview: false,
        body: 'The React client provides hooks and utilities for seamless integration with React applications.',
        code: {
          'App.tsx': `import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
      if (data) setData(data)
    }
    fetchData()
  }, [])

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}`,
        },
      },
      {
        id: 'remix',
        title: 'Remix',
        description: 'Integration with Remix applications',
        installCommand: 'npm install @supabase/supabase-js',
        showPreview: false,
      },
      {
        id: 'nextjs',
        title: 'Next.js',
        description: 'Integration with Next.js applications',
        installCommand: 'npm install @supabase/auth-helpers-nextjs',
        showPreview: false,
      },
      {
        id: 'tanstack',
        title: 'Tanstack Start',
        description: 'Integration with Tanstack applications',
        installCommand: 'npm install @supabase/supabase-js @tanstack/react-query',
        showPreview: false,
      },
    ],
  },
  blocks: {
    id: 'blocks',
    title: 'Blocks',
    body: 'Pre-built UI blocks that you can drop into your application. Each block is designed to solve a specific use case.',
    subsections: [
      {
        id: 'auth-nextjs',
        title: 'Password based auth (Next.js)',
        description: 'Authentication component with email/password login for Next.js',
        installCommand: 'npx shadcn-ui@latest add auth-form',
        showPreview: true,
        code: {
          'auth-form.tsx': `'use client'
 
import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
 
export function AuthForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const supabase = createClientComponentClient()
 
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) console.log(error)
  }
 
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSignUp() }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign Up</button>
    </form>
  )
}`,
        },
      },
      {
        id: 'auth-react',
        title: 'Password based auth (React)',
        description: 'Authentication component with email/password login for React',
        installCommand: 'npx shadcn-ui@latest add auth-form',
        showPreview: true,
      },
    ],
  },
  components: {
    id: 'components',
    title: 'Components',
    body: 'Individual components that you can use to build your application. These components are designed to be composable and reusable.',
    subsections: [
      {
        id: 'realtime-cursor',
        title: 'Realtime Cursor',
        description: 'Show real-time cursor positions of connected users',
        installCommand: 'npm install @supabase/realtime-js',
        showPreview: true,
        code: {
          'cursor.tsx': `'use client'
 
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
 
export function RealtimeCursor() {
  const [cursors, setCursors] = useState({})
 
  useEffect(() => {
    const channel = supabase.channel('cursors')
      .on('broadcast', { event: 'cursor-position' }, ({ payload }) => {
        setCursors((prev) => ({ ...prev, [payload.userId]: payload.position }))
      })
      .subscribe()
 
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
 
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {Object.entries(cursors).map(([userId, position]: [string, any]) => (
        <div
          key={userId}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'red',
          }}
        />
      ))}
    </div>
  )
}`,
        },
      },
      {
        id: 'dropzone',
        title: 'Dropzone',
        description: 'File upload component with drag and drop support',
        installCommand: 'npm install @supabase/storage-js',
        showPreview: true,
      },
    ],
  },
}

// Convert sections to TOC format with proper nesting
const tocItems = [
  {
    title: 'Introduction',
    url: 'introduction',
    depth: 2,
  },
  {
    title: sections.clients.title,
    url: sections.clients.id,
    depth: 2,
  },
  ...sections.clients.subsections.map((item) => ({
    title: item.title,
    url: item.id,
    depth: 3,
  })),
  {
    title: sections.blocks.title,
    url: sections.blocks.id,
    depth: 2,
  },
  ...sections.blocks.subsections.map((item) => ({
    title: item.title,
    url: item.id,
    depth: 3,
  })),
  {
    title: sections.components.title,
    url: sections.components.id,
    depth: 2,
  },
  ...sections.components.subsections.map((item) => ({
    title: item.title,
    url: item.id,
    depth: 3,
  })),
]

const BlocksPage = () => {
  const { theme, setTheme } = useTheme()
  console.log(theme)

  return (
    <div className="grid grid-cols-12 relative gap-4">
      {/* Main content area - 9 columns */}
      <div className="relative col-span-12 md:col-span-10 transition-all duration-100 ease-out p-24">
        <article className="max-w-4xl mx-auto">
          {/* Introduction */}
          <section id="introduction" className="not-prose">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Supabase UI Blocks</h1>
            <p className="text-lg text-foreground-light">
              Supabase UI Blocks are ready-to-use components that help you build beautiful
              applications faster. Each block is designed to solve common use cases and can be
              easily customized to match your needs.
            </p>
          </section>

          {/* Main content */}
          <div className="">
            {Object.values(sections).map((section) => (
              <section key={section.id} id={section.id} className="py-24 border-b">
                <h2 className="text-2xl font-medium mb-2">{section.title}</h2>
                {section.body && (
                  <div className="text-foreground-light mb-6">
                    {typeof section.body === 'string' ? <p>{section.body}</p> : section.body}
                  </div>
                )}
                {section.useTabs ? (
                  <Tabs defaultValue={section.subsections[0]?.id} className="w-full">
                    <TabsList className="w-full gap-6">
                      {section.subsections.map((subsection) => (
                        <TabsTrigger
                          className="text-base"
                          key={subsection.id}
                          value={subsection.id}
                        >
                          {subsection.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {section.subsections.map((subsection) => (
                      <TabsContent key={subsection.id} value={subsection.id}>
                        <div className="py-4">
                          <div className="mb-8">
                            <h3 className="text-lg font-medium">{subsection.title}</h3>
                            <p className="text-foreground-light">{subsection.description}</p>
                          </div>
                          {subsection.code && (
                            <SandpackToggle
                              files={subsection.code}
                              theme={theme === 'dark' ? 'dark' : 'light'}
                              showPreview={subsection.showPreview}
                              installCommand={subsection.installCommand}
                            />
                          )}
                          {subsection.body && (
                            <div className="text-foreground-light mt-8">
                              {typeof subsection.body === 'string' ? (
                                <p>{subsection.body}</p>
                              ) : (
                                subsection.body
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="grid gap-8">
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} id={subsection.id}>
                        <div className="mb-6">
                          <h3 className="text-lg font-medium">{subsection.title}</h3>
                          <p className="text-foreground-light">{subsection.description}</p>
                        </div>
                        {subsection.code && (
                          <SandpackToggle
                            files={subsection.code}
                            theme={theme === 'dark' ? 'dark' : 'light'}
                            showPreview={subsection.showPreview}
                            installCommand={subsection.installCommand}
                          />
                        )}
                        {subsection.body && (
                          <div className="text-foreground-light mt-8">
                            {typeof subsection.body === 'string' ? (
                              <p>{subsection.body}</p>
                            ) : (
                              subsection.body
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>

      {/* Right sidebar with table of contents - 3 columns */}
      <div className="hidden md:flex col-span-2 self-start sticky top-[calc(var(--header-height)+1px+2rem)] max-h-[calc(100vh-var(--header-height)-3rem)]">
        <Toc>
          <h3 className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-foreground pl-[calc(1.5rem+6px)]">
            On this page
          </h3>
          <TOCScrollArea>
            <TOCItems items={tocItems} showTrack />
          </TOCScrollArea>
        </Toc>
      </div>
    </div>
  )
}

export default BlocksPage
