import type { McpClient } from 'ui-patterns/McpUrlBuilder'

export interface PluginClient extends McpClient {
  repoUrl?: string
  docsUrl?: string
}

export const PLUGIN_CLIENTS: PluginClient[] = [
  {
    key: 'claude-code',
    label: 'Claude Code',
    icon: 'claude',
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl: 'https://code.claude.com/docs/en/discover-plugins',
  },
  {
    key: 'codex',
    label: 'Codex',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    repoUrl: 'https://github.com/supabase-community/codex-plugin',
    docsUrl: 'https://developers.openai.com/codex/plugins',
  },
  {
    key: 'cursor',
    label: 'Cursor',
    icon: 'cursor',
    repoUrl: 'https://github.com/supabase-community/cursor-plugin',
    docsUrl: 'https://cursor.com/docs/plugins',
  },
  {
    key: 'gemini-cli',
    label: 'Gemini CLI',
    icon: 'gemini-cli',
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl: 'https://geminicli.com/docs/extensions/',
  },
  {
    key: 'github-copilot',
    label: 'GitHub Copilot',
    icon: 'copilot',
    hasDistinctDarkIcon: true,
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl:
      'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing',
  },
  {
    key: 'kimi',
    label: 'Kimi Code',
    icon: 'kimi',
    hasDistinctDarkIcon: true,
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl: 'https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html',
  },
  {
    key: 'vscode',
    label: 'VS Code',
    icon: 'vscode',
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl: 'https://code.visualstudio.com/docs/agent-customization/agent-plugins',
  },
]
