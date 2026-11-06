import {
  BookOpenIcon,
  BugIcon,
  DatabaseIcon,
  GaugeIcon,
  NotebookTextIcon,
  ShieldCheckIcon,
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
    icon: DatabaseIcon,
    initialMessage: 'Generate sample data for a blog with users, posts, and comments tables.',
  },
  {
    title: 'Set up RLS policies',
    icon: ShieldCheckIcon,
    initialMessage: 'Create RLS policies to ensure users can only access their own data.',
  },
  {
    title: 'Build a notebook',
    icon: NotebookTextIcon,
    initialMessage: 'Build me a notebook that tracks weekly signups and active users.',
  },
]

export const codeSnippetPrompts = [
  {
    title: 'Explain code',
    icon: BookOpenIcon,
    prompt: 'Explain what this code does and how it works',
  },
  {
    title: 'Improve code',
    icon: GaugeIcon,
    prompt: 'How can I improve this code for better performance and readability?',
  },
  {
    title: 'Debug issues',
    icon: BugIcon,
    prompt: 'Help me debug any potential issues with this code',
  },
]
