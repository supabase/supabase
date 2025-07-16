'use client'

import { listTablesSql } from '@/registry/default/platform/platform-kit-nextjs/lib/pg-meta'
import { runQuery } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-run-query'
import { useQuery } from '@tanstack/react-query'

// LIST Tables
const listTables = ({ projectRef, schemas }: { projectRef: string; schemas?: string[] }) => {
  const sql = listTablesSql(schemas)
  return runQuery({
    projectRef,
    query: sql,
    readOnly: true,
  })
}

export const useListTables = (projectRef: string, schemas?: string[]) => {
  return useQuery({
    queryKey: ['tables', projectRef, schemas],
    queryFn: () => listTables({ projectRef, schemas }),
    enabled: !!projectRef,
  })
}
