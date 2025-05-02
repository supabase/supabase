import { Book, Check, ChevronRight, ExternalLink, Plug, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Button,
  Select_Shadcn_,
  SelectValue_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectItem_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
} from 'ui'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { AiIconAnimation } from 'ui'
import { useState } from 'react'
import { EXAMPLE_PROJECTS } from './Home.constants'
import { BASE_PATH } from 'lib/constants'

interface GettingStartedProps {
  projectRef: string
}

export const GettingStarted = ({ projectRef }: GettingStartedProps) => {
  const [show, setShow] = useState(true)
  const { resolvedTheme } = useTheme()

  if (!show) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-foreground-light">Getting Started</CardTitle>
        <Button
          type="text"
          icon={<X size={16} strokeWidth={1.5} />}
          className="w-7 h-7 !mt-0"
          onClick={() => setShow(false)}
        ></Button>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs_Shadcn_ defaultValue="create-table" orientation="vertical">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <TabsList_Shadcn_ className="flex flex-col h-full justify-start items-stretch w-full border-r border-b-0">
              <TabsTrigger_Shadcn_
                value="create-table"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default border-b border-muted"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-brand" />
                  Create your first table
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="add-data"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default border-b border-muted"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-foreground-muted" />
                  Add some data
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="connect-db"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default border-b border-muted"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-foreground-muted" />
                  Connect to your database
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="review-example"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-foreground-muted" />
                  Review an example
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="review-rls"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default border-b border-muted"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-foreground-muted" />
                  Create your first RLS policy
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="sign-up"
                className="py-2 px-3 text-sm w-full !justify-between data-[state=active]:bg-surface-300 data-[state=active]:border-default border-b border-muted"
              >
                <div className="flex items-center gap-2">
                  <Check strokeWidth={1.5} size={16} className="text-foreground-muted" />
                  Sign up your first user
                </div>
                <ChevronRight size={16} />
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>

            <div className="col-span-1 md:col-span-2">
              <TabsContent_Shadcn_
                value="create-table"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch"
              >
                <div className="flex-1 relative w-full">
                  <Image fill objectFit="cover" src="/onboarding/schema.png" alt="Schema" />
                  <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                </div>
                <div className="p-8">
                  <h3 className="mb-1">Get started by building out your database</h3>
                  <p className="text-sm text-foreground-light mb-2">
                    Start building your app by creating tables and inserting data. Our Table Editor
                    makes Postgres as easy to use as a spreadsheet, but there's also our SQL Editor
                    if you need something more.
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <Button size="small" icon={<AiIconAnimation />}>
                      Create with Assistant
                    </Button>
                    <Button size="small" asChild type="default">
                      <Link href={`/project/${projectRef}/editor`}>Go to Table Editor</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="add-data"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch"
              >
                <div className="flex-1 relative w-full">
                  <Image fill objectFit="cover" src="/onboarding/schema.png" alt="Add Data" />
                  <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                </div>
                <div className="p-8">
                  <h3 className="mb-1">Add data to your tables</h3>
                  <p className="text-sm text-foreground-light mb-2">
                    Use our Table Editor to easily insert, update, and manage your data. You can
                    also import data from CSV files or use SQL queries for more complex operations.
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <Button size="small" asChild>
                      <Link href={`/project/${projectRef}/editor`}>Go to Table Editor</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="connect-db"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch"
              >
                <div className="flex-1 relative w-full">
                  <Image fill objectFit="cover" src="/onboarding/connect.png" alt="Connect DB" />
                  <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                </div>
                <div className="p-8">
                  <h3 className="mb-1">Connect to your database</h3>
                  <p className="text-sm text-foreground-light">
                    Interact with your database through the Supabase client libraries with your API
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <Select_Shadcn_ defaultValue="web">
                      <SelectTrigger_Shadcn_ className="w-fit">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="web">Web</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="mobile">Mobile</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="connection">Connection</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="orm">ORM</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <Select_Shadcn_ defaultValue="nextjs">
                      <SelectTrigger_Shadcn_ className="w-fit">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="nextjs">Next.js</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="react">React</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="svelte">Svelte</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="vue">Vue</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <Select_Shadcn_ defaultValue="app">
                      <SelectTrigger_Shadcn_ className="w-fit">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="app">App router</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="pages">Pages router</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <Select_Shadcn_ defaultValue="supabase-js">
                      <SelectTrigger_Shadcn_ className="w-fit">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="supabase-js">Supabase JS</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <Button size={'small'} icon={<Plug size={14} strokeWidth={1.5} />}>
                      Connect
                    </Button>
                    <Button type="default" icon={<Book size={16} strokeWidth={1.5} />} size="small">
                      Docs
                    </Button>
                  </div>
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="review-rls"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch"
              >
                <div className="flex-1 relative w-full">
                  <Image fill objectFit="cover" src="/onboarding/schema.png" alt="RLS Policies" />
                  <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                </div>
                <div className="p-8">
                  <h3 className="mb-1">Review your Row Level Security policies</h3>
                  <p className="text-sm text-foreground-light mb-2">
                    Secure your data with Row Level Security policies. Define who can access what
                    data and ensure your application's security from the database level.
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <Button size="small" icon={<AiIconAnimation />}>
                      Create with Assistant
                    </Button>
                    <Button size="small" asChild type="default">
                      <Link href={`/project/${projectRef}/auth/policies`}>Create a policy</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="sign-up"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch"
              >
                <div className="flex-1 relative w-full">
                  <Image fill objectFit="cover" src="/onboarding/schema.png" alt="Sign Up" />
                  <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-background-surface-100" />
                </div>
                <div className="p-8">
                  <h3 className="mb-1">Sign up your first user</h3>
                  <p className="text-sm text-foreground-light mb-2">
                    Set up authentication and start managing users in your application. Use our
                    built-in auth UI components or create your own custom authentication flow.
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <Button size="small" asChild type="default">
                      <Link href={`/project/${projectRef}/auth/users`}>Manage Users</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="review-example"
                className="mt-0 data-[state=active]:h-80 flex flex-col items-stretch overflow-y-auto"
              >
                <div className="p-8">
                  <h3 className="mb-1">Explore example projects</h3>
                  <p className="text-sm text-foreground-light mb-4">
                    Check out these starter templates and examples to see Supabase in action.
                  </p>
                  <ul className="space-y-1 -mx-3">
                    {EXAMPLE_PROJECTS.sort((a, b) => a.title.localeCompare(b.title)).map(
                      (project) => (
                        <li key={project.title}>
                          <Button
                            asChild
                            type="text"
                            size="small"
                            className="w-full justify-start"
                            icon={
                              <img
                                src={`${BASE_PATH}/img/libraries/${project.framework.toLowerCase()}${
                                  ['expo', 'nextjs'].includes(project.framework.toLowerCase()) &&
                                  resolvedTheme?.includes('dark')
                                    ? '-dark'
                                    : ''
                                }-icon.svg`}
                                width="16"
                                height="16"
                                alt={`${project.framework} logo`}
                                className="mr-2"
                              />
                            }
                            iconRight={
                              <ExternalLink
                                size={14}
                                strokeWidth={1.5}
                                className="ml-1 text-foreground-muted"
                              />
                            }
                          >
                            <Link href={project.url} target="_blank" rel="noopener noreferrer">
                              {project.title}
                            </Link>
                          </Button>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </TabsContent_Shadcn_>
            </div>
          </div>
        </Tabs_Shadcn_>
      </CardContent>
    </Card>
  )
}
