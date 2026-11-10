import { createMCPClient } from '@ai-sdk/mcp'

/**
 * Remote GitHub MCP server. The developer's fine-grained Personal Access Token is
 * forwarded as a bearer token; GitHub scopes the access. The SRE only reads, so a
 * read-only PAT (Contents: Read, Pull requests: Read, Metadata: Read) is the hard
 * gate — write tools fail regardless of what the agent attempts.
 */
const GITHUB_MCP_URL = 'https://api.githubcopilot.com/mcp/'

const SOURCE_NAME = 'supabase-studio-sre'

/**
 * Read-only GitHub tools the SRE may use to correlate a Supabase symptom to code.
 * The set is filtered against what the server actually returns, so unknown names
 * are simply dropped. Keeping it to reads is defense-in-depth on top of the PAT.
 */
export const GITHUB_SRE_ALLOWED_TOOLS = new Set([
  'search_code',
  'get_file_contents',
  'list_commits',
  'get_commit',
  'list_pull_requests',
  'get_pull_request',
  'get_pull_request_files',
  'list_issues',
  'search_issues',
  'list_branches',
  'get_repository',
  'search_repositories',
])

/**
 * Creates an MCP client connected to the remote GitHub MCP server over HTTP,
 * authenticated with the developer's GitHub PAT (session-only, never persisted).
 */
export async function createGitHubMCPClient({ githubToken }: { githubToken: string }) {
  return createMCPClient({
    name: SOURCE_NAME,
    transport: {
      type: 'http',
      url: GITHUB_MCP_URL,
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'x-source-name': SOURCE_NAME,
      },
    },
  })
}
