import { SqlEditor } from 'icons'
import { HelpCircle, Lightbulb } from 'lucide-react'
import { AiIconAnimation, cn } from 'ui'

import { AdvisorBadge } from './AdvisorBadge'
import type { ToolbarButtonConfig } from './ToolbarButton'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'

export interface ToolbarItem {
  key: string
  label: string
  enabled: boolean
  config: ToolbarButtonConfig
}

interface GenerateToolbarItemsOptions {
  projectRef?: string
  isPlatform?: boolean
}

export const generateToolbarItems = (options: GenerateToolbarItemsOptions = {}): ToolbarItem[] => {
  const { projectRef, isPlatform = true } = options

  const showProjectTools = isPlatform && !!projectRef

  return [
    {
      key: 'assistant',
      label: 'AI Assistant',
      enabled: showProjectTools,
      config: {
        id: 'assistant-trigger',
        sidebarKey: SIDEBAR_KEYS.AI_ASSISTANT,
        icon: (isOpen) => (
          <AiIconAnimation
            allowHoverEffect={false}
            size={16}
            className={cn(isOpen && 'text-background')}
          />
        ),
        tooltipText: 'AI Assistant',
        keyboardShortcut: ['Meta', 'I'],
        showKeyboardShortcut: true,
      },
    },
    {
      key: 'inline-editor',
      label: 'SQL Editor',
      enabled: showProjectTools,
      config: {
        id: 'editor-trigger',
        sidebarKey: SIDEBAR_KEYS.EDITOR_PANEL,
        icon: <SqlEditor size={18} strokeWidth={1.5} />,
        tooltipText: 'SQL Editor',
        keyboardShortcut: ['Meta', 'E'],
        showKeyboardShortcut: true,
      },
    },
    {
      key: 'advisor',
      label: 'Advisor Center',
      enabled: isPlatform,
      config: {
        id: 'advisor-center-trigger',
        sidebarKey: SIDEBAR_KEYS.ADVISOR_PANEL,
        icon: () => <Lightbulb size={16} strokeWidth={1.5} />,
        tooltipText: 'Advisor Center',
        badge: <AdvisorBadge />,
      },
    },
    {
      key: 'help',
      label: 'Help & Support',
      enabled: isPlatform,
      config: {
        id: 'help-trigger',
        sidebarKey: SIDEBAR_KEYS.HELP_PANEL,
        icon: () => <HelpCircle size={16} strokeWidth={1.5} />,
        tooltipText: 'Help & Support',
      },
    },
  ]
}
