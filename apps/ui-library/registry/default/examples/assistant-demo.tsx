'use client'

import { AssistantWidget } from '@/registry/default/blocks/assistant/components/assistant-widget'
import { Badge } from '@/registry/default/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/default/components/ui/card'
import { Separator } from '@/registry/default/components/ui/separator'
import { Check, Database, ShieldCheck, Sparkles } from 'lucide-react'

const features = [
  {
    title: 'Query with plain English',
    description: 'Natural language requests turn into SQL via MCP tools.',
    icon: Sparkles,
  },
  {
    title: 'Database aware',
    description: 'Assistant can run validated SQL against your Supabase project.',
    icon: Database,
  },
  {
    title: 'Secure by default',
    description: 'Supabase auth token is forwarded for RLS protected data.',
    icon: ShieldCheck,
  },
]

const setupSteps = [
  'Serve the `chat` and `mcp-server` Edge Functions.',
  'Expose `NEXT_PUBLIC_ASSISTANT_CHAT_URL` and `MCP_SERVER_URL`.',
  'Mount `<AssistantWidget />` near the root layout of your app.',
]

const Feature = ({ title, description, icon: Icon }: (typeof features)[number]) => (
  <div className="flex gap-3 rounded-lg border bg-muted/20 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-5 w-5" strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
)

const SetupChecklist = () => (
  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
      Quick setup
    </p>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {setupSteps.map((step) => (
        <li key={step} className="flex items-start gap-2 text-left">
          <Check className="mt-0.5 h-4 w-4 text-primary" strokeWidth={3 / 2} />
          <span>{step}</span>
        </li>
      ))}
    </ul>
  </div>
)

const AssistantDemoContent = () => (
  <Card className="relative z-10 w-full max-w-3xl border bg-background/95 shadow-2xl backdrop-blur">
    <CardHeader>
      <Badge variant="outline" className="w-fit text-xs font-medium tracking-tight">
        AI Assistant
      </Badge>
      <CardTitle className="text-2xl font-semibold">Ask your data anything</CardTitle>
      <CardDescription>
        The Assistant widget pairs MCP tooling with Supabase authentication so you can run secure,
        natural-language queries against your database without leaving the page.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Feature key={feature.title} {...feature} />
        ))}
      </div>
      <Separator />
      <SetupChecklist />
      <p className="text-xs text-muted-foreground">
        Tip: Click the bubble in the bottom-right corner to open the live assistant powered by the
        same block you install via the registry.
      </p>
    </CardContent>
  </Card>
)

const AssistantDemo = () => (
  <div className="relative flex h-[600px] items-center justify-center bg-gradient-to-b from-background via-muted/40 to-background">
    <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_top,_rgba(15,118,110,0.15),_transparent_50%)]" />
    <AssistantDemoContent />
    <AssistantWidget />
  </div>
)

export default AssistantDemo
