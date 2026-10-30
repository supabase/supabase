import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const {
  docsAgentPlugin: agentPluginEnabled,
  docsAgentSkills: agentSkillsEnabled,
  docsPrompts: promptsEnabled,
} = isFeatureEnabled(['docs:agent_plugin', 'docs:agent_skills', 'docs:prompts'])

export const aiTools: NavMenuConstant = {
  icon: 'ai-tools',
  title: 'AI tools',
  url: '/guides/ai-tools',
  items: [
    { name: 'Agent Plugin', url: '/guides/ai-tools/plugins', enabled: agentPluginEnabled },
    { name: 'MCP server', url: '/guides/ai-tools/mcp' },
    { name: 'Agent Skills', url: '/guides/ai-tools/ai-skills', enabled: agentSkillsEnabled },
    { name: 'Prompts', url: '/guides/ai-tools/ai-prompts', enabled: promptsEnabled },
    {
      name: 'Build AI features',
      items: [{ name: 'Deploy MCP servers', url: '/guides/ai-tools/byo-mcp' }],
    },
  ],
}
