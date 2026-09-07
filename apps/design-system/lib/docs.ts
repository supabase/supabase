import 'server-only'

import { connection } from 'next/server'

export type { Doc } from '@/.velite'

export async function getAllDocs() {
  if (process.env.NODE_ENV === 'development') {
    await connection()
  }

  const { allDocs } = await import('@/.velite')
  return allDocs
}

export async function getDocBySlug(slug: string) {
  const allDocs = await getAllDocs()
  return allDocs.find((doc) => doc.slugAsParams === slug) ?? null
}
