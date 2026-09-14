import type { ProjectResourceAnalysis } from 'common/project-resources'

import resourceManifest from '../__registry__/resources.json'

export type BlockArchitecture = ProjectResourceAnalysis & {
  name: string
  title: string
  fileCount: number
  source?: { url: string; revision: string }
}

// The build analyzes source files once; pages and Markdown consume the same output.
const architectures = resourceManifest as Record<string, BlockArchitecture>

export function getBlockArchitecture(name: string): BlockArchitecture {
  const architecture = Object.hasOwn(architectures, name) ? architectures[name] : undefined
  if (!architecture) throw new Error(`Missing generated resources for block: ${name}`)
  return architecture
}
