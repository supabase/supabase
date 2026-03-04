export interface ToolDefinition {
  name: string
  description: string
  category: 'alerts' | 'issues' | 'agents' | 'tasks'
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    name: 'listAlerts',
    description: 'List recent alerts, filter by issue or severity',
    category: 'alerts',
  },
  {
    name: 'getAlert',
    description: 'Get detailed information about a specific alert',
    category: 'alerts',
  },
  {
    name: 'createAlert',
    description: 'Create a new alert, optionally link to an issue',
    category: 'alerts',
  },
  {
    name: 'commentOnAlert',
    description: 'Add a comment or analysis to an issue conversation',
    category: 'alerts',
  },
  {
    name: 'listIssues',
    description: 'List advisor issues with lifecycle status filtering',
    category: 'issues',
  },
  {
    name: 'listAgents',
    description: 'List all configured AI advisor agents',
    category: 'agents',
  },
  {
    name: 'listTasks',
    description: 'List scheduled agent tasks, filter by agent',
    category: 'tasks',
  },
]

export const TOOL_NAMES = TOOL_CATALOG.map((t) => t.name)
