import { Database, Info, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useParams } from 'common'
import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  LoadingLine,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { getNamespaceTableNameFromPostgresTableName } from '../AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from '../useAnalyticsBucketAssociatedEntities'
import { TableRowComponent } from './TableRowComponent'

// Schema Flow Node Component
interface SchemaFlowNodeProps {
  nodeRef: React.RefObject<HTMLDivElement>
  icon: React.ReactNode
  iconContainerClassName?: string
  label: string
  description: string
  ariaLabel: string
  labelClassName?: string
  isPending?: boolean
}

const SchemaFlowNode = ({
  nodeRef,
  icon,
  iconContainerClassName = '',
  label,
  description,
  ariaLabel,
  labelClassName = 'text-foreground',
  isPending = false,
}: SchemaFlowNodeProps) => {
  return (
    <div
      ref={nodeRef}
      className="flex items-center gap-x-3 rounded bg-surface-75 border border-default px-4 py-4 z-10 shrink-0"
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className={`w-8 h-8 border rounded-md flex items-center justify-center ${iconContainerClassName}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col gap-y-1.5">
        <p className={`text-sm leading-none ${labelClassName}`}>{label}</p>
        {isPending ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm leading-none text-foreground-lighter flex items-center gap-x-1 cursor-help">
                {description}
                <Info size={14} className="text-foreground-lighter" />
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[36ch] text-center text-balance">
              <p>This schema will be created when a table is published from your Iceberg client</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className="text-sm leading-none text-foreground-lighter">{description}</p>
        )}
      </div>
    </div>
  )
}

// Simple Schema Flow Diagram Component
interface SchemaFlowDiagramProps {
  sourceLabel: string
  sourceType: 'analytics' | 'postgres'
  targetLabel: string
  isPending: boolean
}

// Shared constants for SVG styling
const SVG_STROKE_COLOR = 'hsl(var(--foreground-muted))'
const SVG_STROKE_WIDTH = '1.25'
const SVG_CIRCLE_RADIUS = 3
const SVG_DASH_ARRAY = '5, 5'

// Shared CSS styles for animated/static dashed lines
const dashedLineStyles = `
  .schema-flow-animated-dash {
    stroke-dasharray: ${SVG_DASH_ARRAY};
    animation: schema-flow-dash 1s linear infinite;
  }
  .schema-flow-static-dash {
    stroke-dasharray: ${SVG_DASH_ARRAY};
  }
  @keyframes schema-flow-dash {
    to {
      stroke-dashoffset: -10;
    }
  }
`

const SchemaFlowDiagram = ({
  sourceLabel,
  sourceType,
  targetLabel,
  isPending,
}: SchemaFlowDiagramProps) => {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  // Calculate dot color based on theme
  const dotColor = useMemo(
    () => (resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'),
    [resolvedTheme]
  )

  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null)
  const [verticalLinePosition, setVerticalLinePosition] = useState<{
    x: number
    y: number
    height: number
  } | null>(null)

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !sourceRef.current || !targetRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const sourceRect = sourceRef.current.getBoundingClientRect()
      const targetRect = targetRef.current.getBoundingClientRect()

      // Horizontal line position (desktop)
      const sourceX = sourceRect.right - containerRect.left
      const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top
      setLineStart({ x: sourceX, y: sourceY })

      // Vertical line position (mobile) - calculate actual gap between nodes
      const lineX = 64 // ~3rem from left (48px = 3rem), relative to container
      const sourceBottomY = sourceRect.bottom - containerRect.top
      const targetTopY = targetRect.top - containerRect.top
      const gapHeight = targetTopY - sourceBottomY
      setVerticalLinePosition({ x: lineX, y: sourceBottomY, height: gapHeight })
    }

    // Small delay to ensure layout is ready
    const timeoutId = setTimeout(updatePath, 0)
    window.addEventListener('resize', updatePath)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePath)
    }
  }, [sourceLabel, targetLabel])

  // Create dotted background pattern
  const dotPattern = useMemo(() => {
    const radius = 1
    return `radial-gradient(circle, ${dotColor} ${radius}px, transparent ${radius}px)`
  }, [dotColor])

  return (
    <CardHeader
      ref={containerRef}
      className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-24 border-b px-8 py-8 space-y-0"
      role="img"
      aria-label={`Schema flow diagram showing ${sourceLabel} ${sourceType} schema connecting to ${targetLabel} Postgres schema`}
    >
      {/* Shared styles for dashed lines */}
      <style>{dashedLineStyles}</style>
      {/* Dotted Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: dotPattern,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0',
          opacity: 0.2,
        }}
        aria-hidden="true"
      />
      {/* Source Node */}
      <SchemaFlowNode
        nodeRef={sourceRef}
        icon={
          sourceType === 'analytics' ? (
            <img src="/img/icons/iceberg-icon.svg" alt="Iceberg" className="w-5 h-5" />
          ) : (
            <Database size={16} className="text-white" />
          )
        }
        iconContainerClassName={
          sourceType === 'analytics'
            ? 'bg-blue-300 border-blue-600'
            : 'bg-brand-500 border-brand-600'
        }
        label={sourceLabel}
        description={sourceType === 'analytics' ? 'Iceberg namespace' : 'Database schema'}
        ariaLabel={`Source: ${sourceLabel} ${sourceType} schema`}
      />

      {/* SVG Path for Vertical Dashed Line (Mobile) */}
      {verticalLinePosition && (
        <svg
          className="absolute lg:hidden pointer-events-none"
          style={{
            left: `${verticalLinePosition.x - 0.5}px`,
            top: `${verticalLinePosition.y}px`,
            width: '1px',
            height: `${verticalLinePosition.height}px`,
            overflow: 'visible',
            opacity: isPending ? 0.5 : 1,
          }}
          viewBox={`0 0 1 ${verticalLinePosition.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Straight vertical line - uses viewBox coordinates */}
          <path
            d={`M 0.5 0 L 0.5 ${verticalLinePosition.height}`}
            fill="none"
            stroke={SVG_STROKE_COLOR}
            strokeWidth={SVG_STROKE_WIDTH}
            className={isPending ? 'schema-flow-static-dash' : 'schema-flow-animated-dash'}
          />
          {/* Dot at start */}
          <circle cx="0.5" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
          {/* Dot at end */}
          <circle
            cx="0.5"
            cy={verticalLinePosition.height}
            r={SVG_CIRCLE_RADIUS}
            fill={SVG_STROKE_COLOR}
          />
        </svg>
      )}

      {/* SVG Path for Horizontal Dashed Line (Desktop) */}
      {lineStart && (
        <svg
          className="absolute hidden lg:block pointer-events-none"
          style={{
            left: `${lineStart.x}px`,
            top: `${lineStart.y - 0.75}px`,
            width: '6rem',
            height: '1px',
            overflow: 'visible',
            opacity: isPending ? 0.35 : 1,
          }}
          aria-hidden="true"
        >
          {/* Straight horizontal line */}
          <path
            d="M 0 0 L 96 0"
            fill="none"
            stroke={SVG_STROKE_COLOR}
            strokeWidth={SVG_STROKE_WIDTH}
            className={isPending ? 'schema-flow-static-dash' : 'schema-flow-animated-dash'}
          />
          {/* Dot at start */}
          <circle cx="0" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
          {/* Dot at end */}
          <circle cx="96" cy="0" r={SVG_CIRCLE_RADIUS} fill={SVG_STROKE_COLOR} />
        </svg>
      )}

      {/* Target Node */}
      <SchemaFlowNode
        nodeRef={targetRef}
        icon={<Database size={16} className={isPending ? 'text-foreground-muted' : 'text-white'} />}
        iconContainerClassName={
          isPending ? 'bg-surface-100 border-border' : 'bg-brand-500 border-brand-600'
        }
        label={targetLabel}
        description={`Analytics schema`}
        ariaLabel={`Target: ${targetLabel} schema${isPending ? ' that will be created' : ''}`}
        labelClassName={isPending ? 'text-foreground-muted' : 'text-foreground'}
        isPending={isPending}
      />
    </CardHeader>
  )
}

type NamespaceWithTablesProps = {
  bucketName?: string
  namespace: string
  sourceType: 'replication' | 'direct'
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
  wrapperMeta: WrapperMeta
  pollIntervalNamespaceTables: number
  setPollIntervalNamespaceTables: (value: number) => void
}

export const NamespaceWithTables = ({
  bucketName,
  namespace,
  sourceType = 'direct',
  schema,
  tables,
  wrapperInstance,
  wrapperValues,
  wrapperMeta,
  pollIntervalNamespaceTables,
  setPollIntervalNamespaceTables,
}: NamespaceWithTablesProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const { publication } = useAnalyticsBucketAssociatedEntities({ projectRef, bucketId })

  const {
    data: tablesData = [],
    isLoading: isLoadingNamespaceTables,
    isSuccess: isSuccessNamespaceTables,
  } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      namespace: namespace,
      projectRef,
    },
    {
      refetchInterval: (data = []) => {
        if (pollIntervalNamespaceTables === 0) return false

        const publicationTables = publication?.tables ?? []
        const isSynced = !publicationTables.some(
          (x) => !data.includes(getNamespaceTableNameFromPostgresTableName(x))
        )
        if (isSynced) {
          setPollIntervalNamespaceTables(0)
          return false
        }

        return pollIntervalNamespaceTables
      },
    }
  )

  const publicationTables = publication?.tables ?? []
  const publicationTablesNotSyncedToNamespaceTables = publicationTables.filter(
    (x) => !tablesData.includes(getNamespaceTableNameFromPostgresTableName(x))
  )
  const isSyncedPublicationTablesAndNamespaceTables =
    publicationTablesNotSyncedToNamespaceTables.length === 0

  const { mutateAsync: importForeignSchema, isLoading: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation()

  const rescanNamespace = async () => {
    await importForeignSchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      serverName: wrapperInstance.server_name,
      sourceSchema: namespace,
      targetSchema: schema,
    })
  }

  const missingTables = useMemo(() => {
    return (tablesData || []).filter(
      (t) => !tables.find((table) => table.table.split('.')[1] === t)
    )
  }, [tablesData, tables])

  // Get all tables (connected + missing) for display
  const allTables = useMemo(() => {
    const connectedTableNames = tables.map((table) => table.table.split('.')[1])
    const allTableNames = [...new Set([...connectedTableNames, ...missingTables])]

    return allTableNames.map((tableName) => ({
      id: tables.find((t) => t.table_name === tableName)?.id ?? 0,
      name: tableName,
      isConnected: connectedTableNames.includes(tableName),
    }))
  }, [tables, missingTables])

  // Determine if schema is valid (no clashes with Postgres schema)
  // TODO: Replace with actual clash check logic
  const validSchema = useMemo(() => {
    // If schema exists and has tables, it's always valid
    if (schema && tables.length > 0) return true

    // For uploaded namespaces without tables, check for clashes against incoming schema (namespace name)
    // TODO: Replace with actual clash check against Postgres schema
    const hasClashes = false // Mock: no clashes for now

    // Show incoming schema if no clashes (even without tables)
    return !hasClashes
  }, [schema, tables.length])

  // Determine what schema name to display
  const displaySchema = useMemo(() => {
    // If we have a target schema, use it
    if (schema) return schema

    // Otherwise, show the incoming schema (namespace name)
    return `fdw_analytics_${namespace.replaceAll('-', '_')}`
  }, [schema, namespace])

  useEffect(() => {
    if (isSuccessNamespaceTables && !isSyncedPublicationTablesAndNamespaceTables) {
      setPollIntervalNamespaceTables(4000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessNamespaceTables, isSyncedPublicationTablesAndNamespaceTables])

  return (
    <Card>
      {validSchema && (
        <SchemaFlowDiagram
          sourceLabel={sourceType === 'direct' ? namespace : 'public'}
          sourceType={sourceType === 'direct' ? 'analytics' : 'postgres'}
          targetLabel={displaySchema}
          isPending={tables.length === 0}
        />
      )}

      {pollIntervalNamespaceTables > 0 && <LoadingLine loading />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={allTables.length === 0 ? 'text-foreground-muted' : undefined}>
              Table name
            </TableHead>
            {!!publication && (
              <TableHead className={allTables.length === 0 ? 'hidden' : undefined}>
                Replication Status
              </TableHead>
            )}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTables.length === 0 ? (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">No tables yet</p>
                <p className="text-sm text-foreground-lighter">
                  {sourceType === 'direct'
                    ? ' Publish an analytics table from your Iceberg client'
                    : 'Connect a table from your database'}
                </p>
              </TableCell>
            </TableRow>
          ) : (
            allTables.map((table) => (
              <TableRowComponent
                key={table.name}
                table={table}
                namespace={namespace}
                schema={displaySchema}
                isLoading={isImportingForeignSchema || isLoadingNamespaceTables}
              />
            ))
          )}
        </TableBody>
      </Table>
      <ImportForeignSchemaDialog
        bucketName={bucketName ?? ''}
        namespace={namespace}
        circumstance="clash"
        wrapperMeta={wrapperMeta}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
      {(pollIntervalNamespaceTables > 0 || missingTables.length > 0) && (
        <CardFooter className="border-t px-4 py-4 flex flex-row justify-end gap-x-4">
          {pollIntervalNamespaceTables > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-x-2 text-foreground-lighter">
                  <Loader2 size={14} className="animate-spin" />
                  <p className="text-sm">
                    Connecting {publicationTablesNotSyncedToNamespaceTables.length} table
                    {publicationTablesNotSyncedToNamespaceTables.length > 1 ? 's' : ''}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                <p className="mb-1">Waiting for namespace table to be created for:</p>
                <ul className="list-disc pl-6">
                  {publicationTablesNotSyncedToNamespaceTables.map((x) => {
                    const value = `${x.schema}.${x.name}`
                    return <li key={value}>{value}</li>
                  })}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
          {missingTables.length > 0 && (
            <Button
              type={schema ? 'default' : 'warning'}
              size="tiny"
              icon={schema ? <RefreshCw /> : <Plus size={14} />}
              onClick={() => (schema ? rescanNamespace() : setImportForeignSchemaShown(true))}
              loading={isImportingForeignSchema || isLoadingNamespaceTables}
            >
              {schema ? 'Sync tables' : `Connect to table${missingTables.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
