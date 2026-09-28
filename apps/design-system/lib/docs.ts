import 'server-only'

/* eslint-disable turbo/no-undeclared-env-vars */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { connection } from 'next/server'

import type { Doc as DocMeta } from '@/.velite'

export type { DocMeta }

export type Doc = DocMeta & { code: string }

const CODE_DIR = path.join(process.cwd(), '.velite/codes')

async function loadDocCode(codeId: string): Promise<string> {
  const raw = await readFile(path.join(CODE_DIR, `${codeId}.json`), 'utf8')
  return JSON.parse(raw) as string
}

export async function getAllDocs(): Promise<DocMeta[]> {
  if (process.env.NODE_ENV === 'development') {
    await connection()
  }

  const { allDocs } = await import('@/.velite')
  return allDocs
}

export async function getDocMetaBySlug(slug: string): Promise<DocMeta | null> {
  const allDocs = await getAllDocs()
  return allDocs.find((doc) => doc.slugAsParams === slug) ?? null
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  const doc = await getDocMetaBySlug(slug)

  if (!doc) {
    return null
  }

  const code = await loadDocCode(doc.codeId)
  return { ...doc, code }
}
