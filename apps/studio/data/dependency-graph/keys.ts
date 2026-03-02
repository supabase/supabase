export const dependencyGraphKeys = {
  all: (projectRef: string | undefined) => ['projects', projectRef, 'dependency-graph'] as const,
  graph: (
    projectRef: string | undefined,
    schemas?: string[],
    types?: string[]
  ) => [...dependencyGraphKeys.all(projectRef), { schemas, types }] as const,
}
