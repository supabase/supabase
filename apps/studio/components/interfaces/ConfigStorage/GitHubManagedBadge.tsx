import { Github } from 'lucide-react'
import { Badge } from 'ui'

import { isGitHubManagedPath } from '@/data/config/github-config-query'

export interface GitHubManagedBadgeProps {
  configPath: string
  managedPaths?: readonly string[]
}

export function GitHubManagedBadge({ configPath, managedPaths }: GitHubManagedBadgeProps) {
  if (!isGitHubManagedPath(managedPaths, configPath)) return null

  return (
    <Badge variant="success" title={`Managed by GitHub config: ${configPath}`}>
      <Github size={10} />
      GitHub
    </Badge>
  )
}
