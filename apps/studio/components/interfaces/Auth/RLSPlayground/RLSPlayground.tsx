import { useMonaco } from '@monaco-editor/react'
import { DatabaseZap, Download, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, Modal, TextArea_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { RLSTile } from './RLSTile'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import getPgsqlCompletionProvider from '@/components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from '@/components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useGenerateSeedMutation } from '@/data/ai/generate-seed-mutation'
import { useUsersInfiniteQuery } from '@/data/auth/users-infinite-query'
import { useDatabaseFunctionsQuery } from '@/data/database-functions/database-functions-query'
import { useKeywordsQuery } from '@/data/database/keywords-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useTableColumnsQuery } from '@/data/database/table-columns-query'
import { useProjectSchemaDDLQuery } from '@/data/rls-sandbox/project-schema-ddl-query'
import { useProjectSeedDataQuery } from '@/data/rls-sandbox/project-seed-data-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { getErrorMessage } from '@/lib/get-error-message'
import type { TileConfig, TileResult } from '@/lib/rls-sandbox/sandbox-core'
import { useSandbox } from '@/lib/rls-sandbox/SandboxProvider'

const SEED_ROW_LIMIT = 100

export interface LocalTile {
  id: string
  role: TileConfig['role']
  userId?: string
  userEmail?: string
}

export function isAuthenticatedWithoutUser(tile: LocalTile): boolean {
  return tile.role === 'authenticated' && (!tile.userId || !tile.userEmail)
}

function toTileConfig(tile: LocalTile): TileConfig {
  if (tile.role !== 'authenticated') return { id: tile.id, role: tile.role }
  if (tile.userId && tile.userEmail) {
    return { id: tile.id, role: 'authenticated', userId: tile.userId, userEmail: tile.userEmail }
  }
  return { id: tile.id, role: 'anon' }
}

function makeTile(role: LocalTile['role'] = 'anon'): LocalTile {
  return { id: crypto.randomUUID(), role }
}

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'
type SeedMode = 'import' | 'sql' | 'ai'

export function RLSPlayground() {
  const { status: sandboxStatus, core } = useSandbox()
  const { data: project } = useSelectedProjectQuery()

  const [tiles, setTiles] = useState<LocalTile[]>(() => [
    makeTile('anon'),
    makeTile('authenticated'),
  ])
  const [query, setQuery] = useState('select * from public.profiles limit 20')
  const [results, setResults] = useState<Record<string, TileResult | null>>({})
  const [loadingTiles, setLoadingTiles] = useState<Set<string>>(new Set())
  const [policySQL, setPolicySQL] = useState(
    '-- Write policy changes here, then click Apply\n-- e.g. DROP POLICY "profiles: public read" ON public.profiles;\n-- CREATE POLICY "profiles: owner only" ON public.profiles FOR SELECT USING (id = auth.uid());'
  )
  const [applyingPolicy, setApplyingPolicy] = useState(false)
  const [runningQuery, setRunningQuery] = useState(false)
  const [schemaSyncStatus, setSchemaSyncStatus] = useState<SyncStatus>('idle')
  const [seedStatus, setSeedStatus] = useState<SyncStatus>('idle')

  const [seedModalOpen, setSeedModalOpen] = useState(false)
  const [seedMode, setSeedMode] = useState<SeedMode>('import')
  const [customSeedSQL, setCustomSeedSQL] = useState(
    "-- Write INSERT statements to populate the sandbox\n-- e.g. INSERT INTO public.profiles (id, username) VALUES (gen_random_uuid(), 'alice');"
  )
  const [aiSeedPrompt, setAiSeedPrompt] = useState('')
  const [aiGeneratedSQL, setAiGeneratedSQL] = useState('')

  const { mutate: generateSeed, isPending: generatingSeed } = useGenerateSeedMutation({
    onSuccess: ({ sql }) => setAiGeneratedSQL(sql),
  })

  const { data: usersData } = useUsersInfiniteQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: !!project?.ref }
  )
  const users = usersData?.pages.flatMap((p) => p.result) ?? []

  const monaco = useMonaco()
  const pgInfoRef = useRef<any>(null)

  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: dbFunctions, isSuccess: isFunctionsSuccess } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const ddlSchemas = useMemo(() => schemas?.map((s) => s.name) ?? [], [schemas])

  const { data: schemaDDL, refetch: refetchSchema } = useProjectSchemaDDLQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString, schemas: ddlSchemas },
    { enabled: false }
  )

  const { refetch: refetchSeed } = useProjectSeedDataQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tables: schemaDDL?.rlsStatuses ?? [],
      rowLimit: SEED_ROW_LIMIT,
    },
    { enabled: false }
  )

  const isPgInfoReady =
    isKeywordsSuccess && isFunctionsSuccess && isSchemasSuccess && isTableColumnsSuccess
  if (isPgInfoReady) {
    pgInfoRef.current ??= {}
    pgInfoRef.current.keywords = keywords
    pgInfoRef.current.functions = dbFunctions
    pgInfoRef.current.schemas = schemas
    pgInfoRef.current.tableColumns = tableColumns
  }

  useEffect(() => {
    if (!monaco || !isPgInfoReady) return
    const complete = monaco.languages.registerCompletionItemProvider(
      'pgsql',
      getPgsqlCompletionProvider(monaco, pgInfoRef)
    )
    const signature = monaco.languages.registerSignatureHelpProvider(
      'pgsql',
      getPgsqlSignatureHelpProvider(monaco, pgInfoRef)
    )
    return () => {
      complete.dispose()
      signature.dispose()
    }
  }, [isPgInfoReady, monaco])
  // ──────────────────────────────────────────────────────────────────────────

  const syncInProgress = useRef(false)

  const syncSchema = useCallback(async () => {
    if (!core || syncInProgress.current) return
    syncInProgress.current = true
    setSchemaSyncStatus('syncing')
    try {
      const { data } = await refetchSchema()
      if (!data) throw new Error('No schema data returned')
      await core.setSchema(data)
      setSchemaSyncStatus('synced')
      toast.success('Schema synced into sandbox')
    } catch (err) {
      setSchemaSyncStatus('error')
      toast.error(`Schema sync failed: ${getErrorMessage(err) ?? ''}`)
    } finally {
      syncInProgress.current = false
    }
  }, [core, refetchSchema])

  const onAutoSync = useStaticEffectEvent(syncSchema)

  const seedFromProject = useCallback(async () => {
    if (!core) return
    setSeedStatus('syncing')
    try {
      const { data } = await refetchSeed()
      if (!data) throw new Error('No seed data returned')
      await core.setSeed(data)
      const total = data.reduce((sum, t) => sum + t.rows.length, 0)
      setSeedStatus('synced')
      toast.success(`Seeded ${total} rows across ${data.length} tables`)
      setSeedModalOpen(false)
    } catch (err) {
      setSeedStatus('error')
      toast.error(`Seed failed: ${getErrorMessage(err) ?? ''}`)
    }
  }, [core, refetchSeed])

  const closeSeedModal = () => {
    setSeedModalOpen(false)
    setAiGeneratedSQL('')
    setAiSeedPrompt('')
  }

  const applySeed = useCallback(
    async (sql: string) => {
      if (!core || !sql.trim()) return
      setSeedStatus('syncing')
      try {
        await core.broadcastSql(sql)
        setSeedStatus('synced')
        toast.success('Seed applied to sandbox')
        setSeedModalOpen(false)
        setAiGeneratedSQL('')
        setAiSeedPrompt('')
      } catch (err) {
        setSeedStatus('error')
        toast.error(`Seed failed: ${getErrorMessage(err) ?? ''}`)
      }
    },
    [core]
  )

  const handleGenerateSeed = () =>
    generateSeed({
      schema: [
        ...(schemaDDL?.entityDefinitions ?? []),
        ...(schemaDDL?.policies.length
          ? [
              '-- Row Level Security Policies',
              ...schemaDDL.policies.map(
                (p) => `-- "${p.name}" on ${p.schema}.${p.table} FOR ${p.command}`
              ),
            ]
          : []),
      ].join('\n\n'),
      users: users.flatMap((u) => (u.id ? [{ id: u.id, email: u.email ?? u.id }] : [])),
      prompt: aiSeedPrompt,
    })

  const applyPolicy = useCallback(async () => {
    if (!core || !policySQL.trim()) return
    setApplyingPolicy(true)
    try {
      await core.broadcastSql(policySQL)
      toast.success('Policy applied to sandbox')
    } catch (err) {
      toast.error(`Policy apply failed: ${getErrorMessage(err) ?? ''}`)
    } finally {
      setApplyingPolicy(false)
    }
  }, [core, policySQL])

  const runQuery = useCallback(async () => {
    if (!core || !query.trim() || runningQuery) return
    setRunningQuery(true)
    setLoadingTiles(new Set(tiles.map((t) => t.id)))
    setResults({})
    try {
      const all = await core.runAll(tiles.map(toTileConfig), query)
      const next: Record<string, TileResult | null> = {}
      for (const tile of tiles) {
        if (all[tile.id] !== undefined) next[tile.id] = all[tile.id]
      }
      setResults(next)
    } catch (err) {
      toast.error(`Query failed: ${getErrorMessage(err) ?? ''}`)
    } finally {
      setRunningQuery(false)
      setLoadingTiles(new Set())
    }
  }, [core, tiles, query, runningQuery])

  const addTile = () => setTiles((prev) => [...prev, makeTile('anon')])

  const removeTile = (id: string) => {
    setTiles((prev) => prev.filter((t) => t.id !== id))
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateTileRole = (id: string, role: LocalTile['role']) => {
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id ? { id: t.id, role, userId: undefined, userEmail: undefined } : t
      )
    )
  }

  const updateTileUser = (id: string, userId: string, userEmail: string) => {
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, role: 'authenticated' as const, userId, userEmail } : t
      )
    )
  }

  const isSandboxReady = sandboxStatus === 'ready'

  useEffect(() => {
    if (isSandboxReady && ddlSchemas.length > 0 && schemaSyncStatus === 'idle') {
      onAutoSync()
    }
  }, [isSandboxReady, ddlSchemas.length, schemaSyncStatus, onAutoSync])

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>RLS Playground</PageHeaderTitle>
            <PageHeaderDescription>
              Test your Row Level Security policies against real data — entirely in your browser
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button
              type="default"
              icon={
                <Download size={14} className={seedStatus === 'syncing' ? 'animate-pulse' : ''} />
              }
              disabled={
                !isSandboxReady || schemaSyncStatus !== 'synced' || seedStatus === 'syncing'
              }
              onClick={() => setSeedModalOpen(true)}
            >
              {seedStatus === 'synced' ? 'Re-seed data' : 'Seed data'}
            </Button>
            <Button
              type="default"
              icon={
                <RefreshCw
                  size={14}
                  className={schemaSyncStatus === 'syncing' ? 'animate-spin' : ''}
                />
              }
              disabled={!isSandboxReady || schemaSyncStatus === 'syncing'}
              onClick={syncSchema}
            >
              {schemaSyncStatus === 'synced' ? 'Re-sync schema' : 'Sync schema'}
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <Modal
        visible={seedModalOpen}
        onCancel={closeSeedModal}
        header="Seed sandbox data"
        size="large"
        hideFooter
      >
        <Modal.Content className="flex flex-col gap-4 py-4">
          <div className="flex gap-2">
            {(
              [
                {
                  id: 'import',
                  title: 'Import from project',
                  description: `Sample up to ${SEED_ROW_LIMIT} rows per table from your real project`,
                },
                {
                  id: 'sql',
                  title: 'Custom SQL',
                  description: 'Write INSERT statements to populate the sandbox manually',
                },
                {
                  id: 'ai',
                  title: 'Generate with AI',
                  description: 'Let AI create meaningful test data from your schema',
                  icon: <Sparkles size={12} />,
                },
              ] as const
            ).map(({ id, title, description, icon }) => (
              <button
                key={id}
                onClick={() => setSeedMode(id)}
                className={cn(
                  'flex-1 rounded-md border px-3 py-2 text-sm text-left transition-colors',
                  seedMode === id
                    ? 'border-foreground bg-surface-200'
                    : 'border-border hover:border-foreground-muted'
                )}
              >
                <p className="font-medium flex items-center gap-1.5">
                  {icon}
                  {title}
                </p>
                <p className="text-foreground-lighter text-xs mt-0.5">{description}</p>
              </button>
            ))}
          </div>

          {seedMode === 'import' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-foreground-light">
                Fetches rows from each table in the{' '}
                <code className="text-xs bg-surface-300 px-1 py-0.5 rounded">public</code> schema of
                your project and loads them into the sandbox.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="default" onClick={closeSeedModal}>
                  Cancel
                </Button>
                <Button type="primary" loading={seedStatus === 'syncing'} onClick={seedFromProject}>
                  Import from project
                </Button>
              </div>
            </div>
          )}

          {seedMode === 'sql' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-foreground-light">
                SQL runs as the postgres superuser directly against the sandbox.
              </p>
              <div className="h-56 rounded border overflow-hidden">
                <CodeEditor
                  id="rls-playground-custom-seed"
                  language="pgsql"
                  value={customSeedSQL}
                  onInputChange={(val) => setCustomSeedSQL(val ?? '')}
                  actions={{
                    runQuery: {
                      enabled: isSandboxReady,
                      callback: () => applySeed(customSeedSQL),
                    },
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="default" onClick={closeSeedModal}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={seedStatus === 'syncing'}
                  disabled={!customSeedSQL.trim() || seedStatus === 'syncing'}
                  onClick={() => applySeed(customSeedSQL)}
                >
                  Apply SQL
                </Button>
              </div>
            </div>
          )}

          {seedMode === 'ai' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-foreground-light">
                AI reads your table schema and RLS policies to generate INSERT statements. Only the
                schema DDL is sent — no actual data from your database.
              </p>
              {schemaSyncStatus !== 'synced' && (
                <Admonition
                  type="warning"
                  title="Schema not synced"
                  description="Sync your schema first so the AI can read your table structure."
                />
              )}
              <TextArea_Shadcn_
                value={aiSeedPrompt}
                onChange={(e) => setAiSeedPrompt(e.target.value)}
                placeholder="Describe what you need (optional) — e.g. '3 organisations, 10 users across different roles, tasks assigned to multiple users'"
                rows={3}
                className="text-sm resize-none"
              />
              {aiGeneratedSQL && (
                <div className="h-56 rounded border overflow-hidden">
                  <CodeEditor
                    id="rls-playground-ai-seed"
                    language="pgsql"
                    value={aiGeneratedSQL}
                    onInputChange={(val) => setAiGeneratedSQL(val ?? '')}
                    actions={{
                      runQuery: {
                        enabled: isSandboxReady,
                        callback: () => applySeed(aiGeneratedSQL),
                      },
                    }}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="default" onClick={closeSeedModal}>
                  Cancel
                </Button>
                <Button
                  type="default"
                  icon={<Sparkles size={14} />}
                  loading={generatingSeed}
                  disabled={schemaSyncStatus !== 'synced' || generatingSeed}
                  onClick={handleGenerateSeed}
                >
                  {aiGeneratedSQL ? 'Regenerate' : 'Generate'}
                </Button>
                {aiGeneratedSQL && (
                  <Button
                    type="primary"
                    loading={seedStatus === 'syncing'}
                    disabled={seedStatus === 'syncing'}
                    onClick={() => applySeed(aiGeneratedSQL)}
                  >
                    Apply SQL
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Content>
      </Modal>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <div className="flex flex-col gap-6">
              <Admonition
                type="default"
                title="Client-side sandbox — your database is never modified"
                description="Your schema and a sample of your data are loaded into a Postgres instance running entirely in this browser tab via WebAssembly. No queries reach your real database."
              />

              {sandboxStatus === 'booting' && (
                <Admonition
                  type="default"
                  title="Starting sandbox…"
                  description="Loading Postgres into your browser."
                />
              )}

              {sandboxStatus === 'error' && (
                <Admonition
                  type="destructive"
                  title="Sandbox failed to start"
                  description="Try refreshing the page."
                />
              )}

              {schemaSyncStatus === 'synced' && seedStatus === 'idle' && (
                <Admonition
                  type="warning"
                  title="No data in sandbox"
                  description="Load data into the sandbox to test your queries."
                  actions={
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Download size={12} />}
                      onClick={() => setSeedModalOpen(true)}
                    >
                      Seed data
                    </Button>
                  }
                />
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Policy</p>
                  <Button
                    type="default"
                    icon={<ShieldCheck size={14} />}
                    loading={applyingPolicy}
                    disabled={!isSandboxReady || schemaSyncStatus !== 'synced' || applyingPolicy}
                    onClick={applyPolicy}
                  >
                    Apply policy
                  </Button>
                </div>
                <div className="h-32 rounded border overflow-hidden">
                  <CodeEditor
                    id="rls-playground-policy"
                    language="pgsql"
                    value={policySQL}
                    onInputChange={(val) => setPolicySQL(val ?? '')}
                    actions={{
                      runQuery: {
                        enabled: isSandboxReady && schemaSyncStatus === 'synced',
                        callback: applyPolicy,
                      },
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Query</p>
                  <Button
                    type="primary"
                    icon={<DatabaseZap size={14} />}
                    loading={runningQuery}
                    disabled={!isSandboxReady || schemaSyncStatus !== 'synced' || runningQuery}
                    onClick={runQuery}
                  >
                    Run query
                  </Button>
                </div>
                <div className="h-32 rounded border overflow-hidden">
                  <CodeEditor
                    id="rls-playground-query"
                    language="pgsql"
                    value={query}
                    onInputChange={(val) => setQuery(val ?? '')}
                    actions={{
                      runQuery: {
                        enabled: isSandboxReady && schemaSyncStatus === 'synced',
                        callback: runQuery,
                      },
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {tiles.map((tile) => (
                  <RLSTile
                    key={tile.id}
                    tile={tile}
                    result={results[tile.id] ?? null}
                    isLoading={loadingTiles.has(tile.id)}
                    users={users}
                    onChangeRole={updateTileRole}
                    onChangeUser={updateTileUser}
                    onRemove={removeTile}
                  />
                ))}
                <button
                  onClick={addTile}
                  className="flex items-center justify-center gap-2 border border-dashed rounded-lg text-foreground-lighter hover:text-foreground hover:border-foreground-light transition-colors py-3"
                >
                  <Plus size={14} />
                  <span className="text-xs">Add tile</span>
                </button>
              </div>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
