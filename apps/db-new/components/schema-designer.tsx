'use client'

import { useDebounce } from '@/lib/hooks'
import { parseTables } from '@/lib/utils'
import Editor from '@monaco-editor/react'
import { PostgresTable } from '@supabase/postgres-meta'
import { useEffect, useState } from 'react'
import DiagramImportModal from './diagram-import-modal'
import { Button } from './ui/button'

// TODO: leave empty, but this is a nice initial schema for development
const initialSql = `CREATE TABLE department (
  id bigint primary key generated always as identity,
  name text
);

CREATE TABLE project (
  id bigint primary key generated always as identity,
  name text
);

CREATE TABLE employee (
  id bigint primary key generated always as identity,
  name text,
  job_title text,
  department_id bigint references department(id),
  project_id bigint references project(id)
);`

export default function SchemaDesigner() {
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false)
  const [sql, setSql] = useState<string | undefined>(initialSql)
  const debouncedSql = useDebounce(sql, 500)
  const [tables, setTables] = useState<Partial<PostgresTable>[]>()

  useEffect(() => {
    async function run() {
      if (!debouncedSql) {
        return
      }

      try {
        const pgTables = await parseTables(debouncedSql)
        setTables(pgTables)
      } catch (err) {
        setTables(undefined)
      }
    }

    run()
  }, [debouncedSql])

  // TODO: add AI prompt input, diff editor, schema visualizer
  return (
    <>
      <DiagramImportModal
        open={isDiagramModalOpen}
        onOpenChange={setIsDiagramModalOpen}
        onImport={setSql}
      />
      <div className="flex flex-col self-stretch grow h-full w-full p-5 bg-[#1e1e1e] rounded-lg">
        <div className="mb-4">
          <Button onClick={() => setIsDiagramModalOpen(true)}>Draw DB diagram</Button>
        </div>
        <div className="grow">
          <Editor
            value={sql}
            onChange={(text) => setSql(text)}
            defaultLanguage="pgsql"
            theme="vs-dark"
            options={{
              fontSize: 16,
              minimap: {
                enabled: false,
              },
            }}
          />
        </div>
      </div>
    </>
  )
}
