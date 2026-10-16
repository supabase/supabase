import dayjs from 'dayjs'
import { Activity, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Row } from 'ui-patterns/Row'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useDatabaseHealthQuery } from '@/data/database/database-health-query'
import {
  DATABASE_HEALTH_STATUS_LABELS,
  type DatabaseHealthCategory,
  type DatabaseHealthFinding,
  type DatabaseHealthResult,
  type DatabaseHealthSeverity,
} from '@/data/database/database-health-score'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const STATUS_BADGE_VARIANTS: Record<
  DatabaseHealthResult['status'],
  'success' | 'warning' | 'destructive' | 'default'
> = {
  healthy: 'success',
  needs_attention: 'warning',
  critical: 'destructive',
  unavailable: 'default',
}

const SEVERITY_BADGE_VARIANTS: Record<
  DatabaseHealthSeverity,
  'warning' | 'destructive' | 'default'
> = {
  high: 'destructive',
  medium: 'warning',
  low: 'default',
}

const SEVERITY_LABELS: Record<DatabaseHealthSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const scoreColorClass = (score: number) => {
  if (score >= 80) return 'text-brand-600'
  if (score >= 50) return 'text-warning-600'
  return 'text-destructive-600'
}

export const DatabaseHealthSection = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data, error, isPending, isError, isFetching, refetch } = useDatabaseHealthQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-2 gap-4">
        <h2>Database health</h2>
        <Button
          variant="default"
          icon={<RefreshCw className={cn(isFetching && 'animate-spin')} />}
          loading={isFetching}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>
      <p className="text-sm text-foreground-light mb-6">
        A live snapshot of PostgreSQL statistics, taken when you loaded this page. It does not cover
        Auth, Storage, Realtime or Edge Functions.
      </p>

      {isPending && (
        <div className="flex flex-col gap-2">
          <ShimmeringLoader className="h-24" />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      {isError && (
        <Admonition
          type="default"
          title="Unable to read database health"
          description={error.message}
        />
      )}

      {!isPending && !isError && (
        <DatabaseHealthReport result={data.result} collectedAt={data.collectedAt} />
      )}
    </div>
  )
}

export const DatabaseHealthReport = ({
  result,
  collectedAt,
}: {
  result: DatabaseHealthResult
  collectedAt: string
}) => {
  const unavailableCategories = result.categories.filter(
    (category) => category.status === 'unavailable'
  )

  if (result.status === 'unavailable') {
    return (
      <Admonition
        type="default"
        title="Unable to read database health"
        description="None of the diagnostic queries returned. The database may be unreachable or under load."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-center gap-6 p-6">
          <div className="flex items-baseline gap-3 min-w-48">
            <span className={cn('text-5xl font-medium', scoreColorClass(result.score ?? 0))}>
              {result.score}
            </span>
            <span className="text-sm text-foreground-light">/ 100</span>
            <Badge variant={STATUS_BADGE_VARIANTS[result.status]}>
              {DATABASE_HEALTH_STATUS_LABELS[result.status]}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 text-sm text-foreground-light">
            <p>
              {result.findings.length === 0
                ? 'No checks lost points.'
                : `${result.findings.length} ${result.findings.length === 1 ? 'check' : 'checks'} lost points.`}
            </p>
            <p>Collected {dayjs(collectedAt).format('HH:mm:ss')}</p>
          </div>
        </CardContent>
      </Card>

      {result.criticalConditions.length > 0 && (
        <Admonition
          type="destructive"
          title="Score capped at 30 by a critical condition"
          description={result.criticalConditions.join('. ')}
        />
      )}

      <Row maxColumns={5} minWidth={180}>
        {result.categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </Row>

      {unavailableCategories.length > 0 && (
        <Admonition
          type="warning"
          title="Some categories could not be checked"
          description={`${unavailableCategories
            .map((category) => category.label)
            .join(', ')} were excluded from the score rather than counted as healthy.`}
        />
      )}

      {result.findings.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      {result.skippedChecks.length > 0 && (
        <div className="flex flex-col gap-1 text-xs text-foreground-lighter">
          <p className="flex items-center gap-1.5">
            <Info size={12} /> Checks skipped for insufficient data
          </p>
          {result.skippedChecks.map((check) => (
            <p key={check.id} className="pl-5">
              {check.id}: {check.reason}
            </p>
          ))}
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <Collapsible>
          <CollapsibleTrigger className="text-xs text-foreground-lighter">
            Show raw metrics and penalties
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-surface-100 border rounded p-4 overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

const CategoryCard = ({ category }: { category: DatabaseHealthCategory }) => (
  <Card className="min-h-full">
    <CardHeader className="border-b-0 pb-0">
      <CardTitle className="text-foreground-light">{category.label}</CardTitle>
    </CardHeader>
    <CardContent className="pt-2">
      {category.status === 'unavailable' ? (
        <div className="flex items-center gap-2 text-sm text-foreground-lighter">
          <AlertTriangle size={14} /> Unavailable
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-medium', scoreColorClass(category.score))}>
            {category.score}
          </span>
          <span className="text-xs text-foreground-lighter">{category.weight}% of score</span>
        </div>
      )}
    </CardContent>
  </Card>
)

const FindingCard = ({ finding }: { finding: DatabaseHealthFinding }) => (
  <Card>
    <CardContent className="flex flex-col md:flex-row md:items-start gap-4 p-4">
      <Activity size={16} strokeWidth={1.5} className="text-foreground-light mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm">{finding.title}</h3>
          <Badge variant={SEVERITY_BADGE_VARIANTS[finding.severity]}>
            {SEVERITY_LABELS[finding.severity]}
          </Badge>
          <span className="text-xs text-foreground-lighter">-{finding.deduction} points</span>
        </div>
        <p className="text-sm text-foreground-light">{finding.description}</p>
        <p className="text-sm text-foreground">{finding.action}</p>
      </div>
    </CardContent>
  </Card>
)
