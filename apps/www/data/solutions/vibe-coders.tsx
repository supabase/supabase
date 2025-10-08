import { Timer, Zap, CheckCircle } from 'lucide-react'
import { Button, Image } from 'ui'
import type {
  FeaturesSection,
  HeroSection,
  Metadata,
} from './solutions.utils'

const data: {
  metadata: Metadata
  heroSection: HeroSection
  why: FeaturesSection
  platform: any
  platformStarterSection: any
} = {
    metadata: {
      metaTitle: 'Supabase for Vibe Coders',
      metaDescription:
        'Your weekend prototype deserves production. Stop letting backend complexity kill your momentum. Supabase is the production-ready backend that works with your AI tools from day one.',
    },
    heroSection: {
      id: 'hero',
      title: 'Vibe Coders',
      h1: (
        <>
          <span className="block text-foreground">Your weekend prototype</span>
          <span className="text-brand block md:ml-0">deserves production</span>
        </>
      ),
      subheader: [
        <>
          Weekend project. Real users. Now what? Stop letting backend complexity kill your momentum.
          Supabase is a production-ready backend that works with your AI tools from day one. No DevOps
          degree required. No months of setup. No &quot;learning the hard way.&quot; <strong>Just ship.</strong>
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start Your Project',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
        },
      ],
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          The <span className="text-foreground">Vibe Coder&apos;s Dilemma</span>
        </>
      ),
      subheading:
        'Your AI assistant nails the prototype. Users actually want it. Then reality hits. Authentication breaks. Databases crash. Deployment becomes a nightmare. You&apos;re not alone. Every vibe coder hits this wall.',
      features: [
        {
          id: 'instant-backend',
          icon: Zap,
          heading: 'Break through with our Vibe Coding Toolkit',
          subheading:
            'Supabase gives you the tools to easily manage databases, authentication, and backend infrastructure so you can build faster and ship with confidence.',
        },
        {
          id: 'ai-tools-integration',
          icon: Timer,
          heading: 'Built for how you build',
          subheading:
            'Supabase is a production-ready backend that works with your AI tools from day one. No DevOps degree required. No months of setup. No &quot;learning the hard way.&quot; Just ship.',
        },
        {
          id: 'production-ready',
          icon: CheckCircle,
          heading: 'From prototype to production',
          subheading:
            'Start with a weekend project and scale to millions of users. Supabase handles the complexity so you can focus on what matters - building great products.',
        },
      ],
    },
    platform: {
      id: 'vibe-coding-platform',
      title: (
        <>
          The <span className="text-foreground">Vibe Coding Platform</span>
        </>
      ),
      subheading:
        'Supabase is the backend platform for apps created by your favorite AI Builders. Figma, Lovable, Bolt, Vercel v0, and more.',
      className: '',
      features: [
        {
          id: 'ai-builders',
          title: 'AI Builder Integration',
          icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
          subheading: (
            <>
              Supabase is the backend platform for apps created by{' '}
              <span className="text-foreground">your favorite AI Builders</span>. Figma, Lovable, Bolt,
              Vercel v0, and more.
            </>
          ),
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for AI Builder tools section with colorful icons and links to their sites]
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'database',
          title: 'Database',
          icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
          subheading: (
            <>
              A fully managed database that&apos;s simple for creators and{' '}
              <span className="text-foreground">trusted by enterprises</span>.
            </>
          ),
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for database screenshot showing table structure and data]
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'authentication',
          title: 'Authentication',
          icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
          subheading: (
            <>
              Let your users{' '}
              <span className="text-foreground">login with email, Google, Apple, GitHub</span>, and
              more. Secure and trusted.
            </>
          ),
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for authentication providers and login flow]
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'storage',
          title: 'Storage',
          icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
          subheading: (
            <>
              <span className="text-foreground">Affordable and fast,</span> for all the videos and
              images you need in your app.
            </>
          ),
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for file storage interface showing upload and management]
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'realtime',
          title: 'Realtime',
          icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
          subheading: (
            <>
              Build immersive{' '}
              <span className="text-foreground">multi-player, collaborative experiences</span>.
            </>
          ),
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for realtime features showing live updates and collaboration]
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 'edge-functions',
          title: 'Edge Functions',
          icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
          subheading: <>Custom backend logic when you want to dive into code.</>,
          image: (
            <div className="relative w-full max-w-xl pt-8">
              <div className="w-full h-full rounded-lg overflow-hidden border bg-surface-75 p-6">
                <p className="text-foreground-light text-sm">
                  [Placeholder for edge functions showing serverless function deployment]
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    platformStarterSection: {
      id: 'vibe-coding-toolkit',
      heading: (
        <>
          <span className="text-foreground block">The Vibe Coding Toolkit</span>
        </>
      ),
      headingRight: (
        <>
          A collection of resources for vibe coders, hackathon participants, and even some experienced
          developers.
        </>
      ),
      docsUrl: 'https://supabase.com/docs',
      leftFooter: (
        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">The Vibe Coding Master Checklist</h3>
            <p className="text-sm text-foreground-light mb-3">
              Your complete guide to taking a weekend project from prototype to production.
            </p>
            <Button asChild size="small" type="default">
              <a href="https://www.notion.so/The-Vibe-Coding-Master-Checklist-2725004b775f80b6adf4d52726f12c51" target="_blank" rel="noopener noreferrer">
                Read the checklist
              </a>
            </Button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Vibe Coding: Best Practices for Prompting</h3>
            <p className="text-sm text-foreground-light mb-3">
              Learn how to get the most out of your AI tools when building prototypes.
            </p>
            <Button asChild size="small" type="default">
              <a href="https://www.notion.so/Vibe-Coding-Best-Practices-for-Prompting-2725004b775f805b91bdd95c28db9835" target="_blank" rel="noopener noreferrer">
                Read the guide
              </a>
            </Button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Testing for Vibe Coders: From Zero to Production Confidence</h3>
            <p className="text-sm text-foreground-light mb-3">
              Build confidence in your code with testing strategies that don&apos;t slow you down.
            </p>
            <Button asChild size="small" type="default">
              <a href="https://www.notion.so/Testing-for-Vibe-Coders-From-Zero-to-Production-Confidence-2705004b775f80caac0acee81f757c68" target="_blank" rel="noopener noreferrer">
                Read the guide
              </a>
            </Button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">The Vibe Coder&apos;s Guide to Supabase Environments</h3>
            <p className="text-sm text-foreground-light mb-3">
              Master your development workflow with proper environment management.
            </p>
            <Button asChild size="small" type="default">
              <a href="https://www.notion.so/The-Vibe-Coder-s-Guide-to-Supabase-Environments-2705004b775f80bab6a1d81c65f59b5b" target="_blank" rel="noopener noreferrer">
                Read the guide
              </a>
            </Button>
          </div>
        </div>
      ),
      aiPrompts: [
        {
          id: 'vibe-coder-auth',
          title: 'Quick Auth Setup for Vibe Coders',
          code: `1. Install @supabase/supabase-js
2. Set up environment variables
3. Create auth client
4. Add login/signup components
5. Protect your routes`,
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/auth',
          copyable: true,
        },
        {
          id: 'vibe-coder-database',
          title: 'Database Schema for Rapid Prototyping',
          code: `-- Create tables with RLS enabled
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
          language: 'sql',
          docsUrl: 'https://supabase.com/docs/guides/database',
          copyable: true,
        },
        {
          id: 'vibe-coder-deployment',
          title: 'Deploy to Production in Minutes',
          code: `1. Connect your GitHub repo
2. Set environment variables
3. Deploy with one click
4. Get your production URL
5. Share with users`,
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/platform',
          copyable: true,
        },
        {
          id: 'vibe-coder-edge-functions',
          title: 'Serverless Functions for Vibe Coders',
          code: `// Edge Function example
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  
  return new Response(
    JSON.stringify({ message: \`Hello \${name}!\` }),
    { headers: { "Content-Type": "application/json" } },
  )
})`,
          language: 'typescript',
          docsUrl: 'https://supabase.com/docs/guides/functions',
          copyable: true,
        },
      ],
    },
  }

export { data as default }
