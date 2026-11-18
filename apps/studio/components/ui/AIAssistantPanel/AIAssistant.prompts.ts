import {
  BookOpenIcon,
  BugIcon,
  DatabaseIcon,
  GaugeIcon,
  NotebookTextIcon,
  ShieldAlertIcon,
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
    title: 'Build a notebook',
    icon: NotebookTextIcon,
    initialMessage: 'Build me a notebook that tracks weekly signups and active users.',
  },
  {
    title: 'Audit project security',
    icon: ShieldAlertIcon,
    initialMessage:
      "Audit my project's security. Find anything the public API key or a signed-in user can read, write, or call that they shouldn't.",
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
