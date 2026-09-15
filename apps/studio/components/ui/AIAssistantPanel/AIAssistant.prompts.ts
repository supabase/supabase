import {
  BookOpen,
  Bug,
  Database,
  Gauge,
  NotebookText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type ChatTemplate = {
  title: string
  icon: LucideIcon
  initialMessage: string
}

export const CHAT_TEMPLATES: ChatTemplate[] = [
  {
    title: 'Generate sample data',
    icon: Database,
    initialMessage: 'Generate sample data for a blog with users, posts, and comments tables.',
  },
  {
    title: 'Set up RLS policies',
    icon: ShieldCheck,
    initialMessage: 'Create RLS policies to ensure users can only access their own data.',
  },
  {
    title: 'Build a notebook',
    icon: NotebookText,
    initialMessage: 'Build me a notebook that tracks weekly signups and active users.',
  },
]

export const codeSnippetPrompts = [
  {
    title: 'Explain code',
    icon: BookOpen,
    prompt: 'Explain what this code does and how it works',
  },
  {
    title: 'Improve code',
    icon: Gauge,
    prompt: 'How can I improve this code for better performance and readability?',
  },
  {
    title: 'Debug issues',
    icon: Bug,
    prompt: 'Help me debug any potential issues with this code',
  },
]
