import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { SqlEditor } from 'icons'
import { Lightbulb, HelpCircle } from 'lucide-react'
import { AiIconAnimation, cn } from 'ui'

import { AdvisorBadge } from './AdvisorBadge'
import type { ToolbarButtonConfig } from './ToolbarButton'

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

/**
 * Generate toolbar items for the SidebarToolbar
 * Following the pattern used in NavigationBar.utils.tsx and Sidebar.tsx
 */
export const generateToolbarItems = (options: GenerateToolbarItemsOptions = {}): ToolbarItem[] => {
  const { projectRef, isPlatform = true } = options

  // Only show these items on platform and when we have a project ref
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
        icon: (isOpen) => (
          <Lightbulb
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-light group-hover:text-foreground',
              isOpen && 'text-background group-hover:text-background'
            )}
          />
        ),
        tooltipText: 'Advisor Center',
        badge: <AdvisorBadge projectRef={projectRef} />,
      },
    },
    {
      key: 'help',
      label: 'Help & Support',
      enabled: isPlatform,
      config: {
        id: 'help-trigger',
        sidebarKey: SIDEBAR_KEYS.HELP_PANEL,
        icon: (isOpen) => (
          <HelpCircle
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-light group-hover:text-foreground',
              isOpen && 'text-background group-hover:text-background'
            )}
          />
        ),
        tooltipText: 'Help & Support',
      },
    },
  ]
}
