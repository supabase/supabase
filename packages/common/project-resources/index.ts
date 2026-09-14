import { analyzeFunctions } from './functions'
import { compareStrings, isTestOrGeneratedPath, normalizeProjectPath } from './paths'
import { analyzeRoute } from './routes'
import { analyzeTables } from './tables'
import type {
  ProjectFile,
  ProjectResource,
  ProjectResourceAnalysis,
  ProjectResourceDiagnostic,
  ProjectResourceOptions,
} from './types'

export type {
  ProjectFile,
  ProjectFramework,
  ProjectResource,
  ProjectResourceAnalysis,
  ProjectResourceDiagnostic,
  ProjectResourceOptions,
} from './types'

/** Analyze supplied project-relative source files without reading a filesystem or executing project code. */
export async function analyzeProjectResources(
  files: readonly ProjectFile[],
  options: ProjectResourceOptions = {}
): Promise<ProjectResourceAnalysis> {
  const diagnostics: ProjectResourceDiagnostic[] = []
  const framework = options?.framework ?? 'generic'
  if (
    !Array.isArray(files) ||
    !['nextjs', 'nuxt', 'tanstack', 'react-router', 'flutter', 'generic'].includes(framework)
  ) {
    return {
      resources: [],
      diagnostics: [
        {
          code: 'invalid-input',
          message: 'Supply a file array and a supported project framework.',
          files: [],
        },
      ],
    }
  }
  const normalized = new Map<string, ProjectFile>()
  const conflicts = new Set<string>()
  for (const file of files) {
    const path = file && typeof file.path === 'string' ? normalizeProjectPath(file.path) : undefined
    if (!path || (file.content !== undefined && typeof file.content !== 'string')) {
      diagnostics.push({
        code: 'invalid-input',
        message:
          'File paths must be relative to the project root and content must be a string when supplied.',
        files: typeof file?.path === 'string' ? [file.path] : [],
      })
      continue
    }
    if (conflicts.has(path) || isTestOrGeneratedPath(path)) continue
    const previous = normalized.get(path)
    if (
      previous &&
      previous.content !== undefined &&
      file.content !== undefined &&
      previous.content !== file.content
    ) {
      diagnostics.push({
        code: 'conflicting-file',
        message: 'Conflicting contents were supplied for the same file; that file was excluded.',
        files: [path],
      })
      normalized.delete(path)
      conflicts.add(path)
    } else normalized.set(path, { path, content: file.content ?? previous?.content })
  }
  const ordered = [...normalized.values()].sort((a, b) => compareStrings(a.path, b.path))
  const discovered = [
    ...(await analyzeTables(ordered, diagnostics)),
    ...analyzeFunctions(ordered, diagnostics),
    ...ordered.flatMap((file) => analyzeRoute(file, framework, diagnostics)),
  ]
  const resources = new Map<string, ProjectResource>()
  for (const resource of discovered) {
    const previous = resources.get(resource.id)
    resources.set(resource.id, {
      ...resource,
      files: [...new Set([...(previous?.files ?? []), ...resource.files])].sort(compareStrings),
    })
  }
  const uniqueDiagnostics = new Map(
    diagnostics.map((diagnostic) => {
      const normalized = {
        ...diagnostic,
        files: [...new Set(diagnostic.files)].sort(compareStrings),
      }
      return [JSON.stringify(normalized), normalized]
    })
  )
  return {
    resources: [...resources.values()].sort((a, b) => compareStrings(a.id, b.id)),
    diagnostics: [...uniqueDiagnostics.values()].sort((a, b) =>
      compareStrings(JSON.stringify(a), JSON.stringify(b))
    ),
  }
}
