/**
 * Builds the "files this setup touches" tree shown for an existing project.
 * Ported from the prototype's `fileTree()`.
 */
import { FRAMEWORKS, type StartConfig } from './config'
import { selectedPrimitives, type StartComposition } from './composition/start-composition'

export interface FileTreeNode {
  name: string
  dir?: boolean
  status?: 'new' | 'edit'
  note?: string
  children?: FileTreeNode[]
}

export function buildFileTree(cfg: StartConfig, composition: StartComposition): FileTreeNode {
  const fw = FRAMEWORKS[cfg.framework]
  const prims = selectedPrimitives(cfg, composition)
  const schemaFileNames = getSchemaFileNames(composition)
  const root: FileTreeNode = { name: 'your-app', dir: true, children: [] }
  const children = root.children!

  children.push({ name: fw.envFile, status: 'edit', note: 'add your keys' })

  // Backend-only: no client library, UI routes or components — just config and schema.
  if (fw.id === 'none') {
    if (cfg.orm === 'drizzle') {
      children.push({ name: 'src/db', dir: true, children: [{ name: 'schema.ts', status: 'new' }] })
      children.push({ name: 'drizzle.config.ts', status: 'new' })
    } else if (cfg.orm === 'prisma') {
      children.push({
        name: 'prisma',
        dir: true,
        children: [{ name: 'schema.prisma', status: 'new' }],
      })
    } else if (prims.includes('database')) {
      children.push({
        name: 'supabase/schemas',
        dir: true,
        children: schemaFileNames.map((name) => ({ name, status: 'new' })),
      })
    }
    return root
  }

  if (fw.id === 'nextjs') {
    children.push({
      name: 'utils/supabase',
      dir: true,
      children: [
        { name: 'client.ts', status: 'new', note: 'browser client' },
        { name: 'server.ts', status: 'new', note: 'server client' },
        { name: 'middleware.ts', status: 'new' },
      ],
    })
    children.push({ name: 'middleware.ts', status: 'new', note: 'refresh sessions' })
  } else {
    children.push({
      name: fw.utilsDir,
      dir: true,
      children: [{ name: 'supabase.ts', status: 'new', note: 'client' }],
    })
  }

  if (prims.includes('auth')) {
    children.push(
      fw.id === 'nextjs'
        ? {
            name: 'app',
            dir: true,
            children: [
              { name: 'login', dir: true, children: [{ name: 'page.tsx', status: 'new' }] },
              {
                name: 'auth/confirm',
                dir: true,
                children: [{ name: 'route.ts', status: 'new' }],
              },
            ],
          }
        : { name: 'src/routes', dir: true, children: [{ name: 'login.tsx', status: 'new' }] }
    )
  }

  if (prims.includes('storage')) {
    children.push({
      name: 'components',
      dir: true,
      children: [{ name: 'uploader.tsx', status: 'new' }],
    })
  }

  if (cfg.orm === 'drizzle') {
    children.push({ name: 'src/db', dir: true, children: [{ name: 'schema.ts', status: 'new' }] })
    children.push({ name: 'drizzle.config.ts', status: 'new' })
  } else if (cfg.orm === 'prisma') {
    children.push({
      name: 'prisma',
      dir: true,
      children: [{ name: 'schema.prisma', status: 'new' }],
    })
  } else if (prims.includes('database')) {
    children.push({
      name: 'supabase/schemas',
      dir: true,
      children: schemaFileNames.map((name) => ({ name, status: 'new' })),
    })
  }

  return root
}

function getSchemaFileNames(composition: StartComposition): string[] {
  const schemaFiles =
    composition.mergeResult?.files
      .map((file) => file.path.match(/^supabase\/schemas\/([^/]+\.sql)$/)?.[1])
      .filter((fileName): fileName is string => Boolean(fileName)) ?? []

  return schemaFiles.length > 0 ? schemaFiles : ['todos.sql']
}

/** Renders a file tree as indented text (used in the agent plan). */
export function treeToText(node: FileTreeNode, depth: number): string {
  const pad = '  '.repeat(depth)
  const tag = node.status
    ? `   # ${node.status}${node.note ? ` — ${node.note}` : ''}`
    : node.note
      ? `   # ${node.note}`
      : ''
  let out = `${pad}${node.name}${node.dir ? '/' : ''}${tag}\n`
  if (node.dir && node.children) {
    for (const child of node.children) out += treeToText(child, depth + 1)
  }
  return out
}
