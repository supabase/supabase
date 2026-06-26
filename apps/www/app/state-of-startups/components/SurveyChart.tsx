'use client'

import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Button } from 'ui'

import {
  distributionToBars,
  getDistribution,
  mergeFilters,
  type Aggregation,
  type SurveyFilters,
} from '../lib/survey-keys'
import { useAccent } from './accent-context'
import TwoOptionToggle from './TwoOptionToggle'
import { useYear } from './year-context'

interface SurveyChartProps {
  title: string
  column: string
  aggregation: Aggregation
  /** Static filters baked into the chart config (e.g. location = North America). */
  filters?: SurveyFilters
  /** Section-level cohort toggle filter, merged on top of `filters`. */
  cohortFilter?: SurveyFilters
  maxBars?: number
}

export function SurveyChart({
  title,
  column,
  aggregation,
  filters,
  cohortFilter,
  maxBars,
}: SurveyChartProps) {
  const { year } = useYear()
  const accent = useAccent()
  const accentBg = 'hsl(var(--brand-300))'
  const accentBarFg = 'bg-brand'
  const accentBarText = 'text-brand-link dark:text-brand'

  const effectiveFilters = useMemo(
    () => mergeFilters(filters, cohortFilter),
    [filters, cohortFilter]
  )

  const chartData = useMemo(() => {
    const dist = getDistribution(year, column, aggregation, effectiveFilters)
    return distributionToBars(dist, maxBars)
  }, [year, column, aggregation, effectiveFilters, maxBars])

  const isAvailableForYear = chartData.length > 0

  const [view, setView] = useState<'chart' | 'sql'>('chart')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleViewChange = (newView: 'chart' | 'sql') => {
    setView(newView)
    setIsExpanded(true)
  }

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.value)) : 0

  const FIXED_HEIGHT = 300 // px
  const BUTTON_AREA_HEIGHT = 40 // px
  const CHART_HEIGHT = FIXED_HEIGHT - BUTTON_AREA_HEIGHT // px

  const sql = useMemo(() => {
    const fn =
      aggregation === 'multi'
        ? 'get_multi_select_stats'
        : aggregation === 'boolean'
          ? 'get_boolean_stats'
          : 'get_single_select_stats'
    const filterArg = effectiveFilters ? `, '${JSON.stringify(effectiveFilters)}'::jsonb` : ''
    return `-- Pre-aggregated and embedded at build time\nselect label, count\nfrom ${fn}(${year}, '${column}'${filterArg});`
  }, [aggregation, effectiveFilters, year, column])

  return (
    <div
      className="w-full bg-200 border-t border-muted"
      style={{
        background: `radial-gradient(circle at center -150%, ${accentBg}, transparent 80%), radial-gradient(ellipse at center 230%, hsl(var(--background-surface-200)), transparent 75%)`,
      }}
    >
      <header className="px-8 py-8">
        <p className="text-foreground/30 text-sm font-mono uppercase tracking-widest">Q&A</p>
        <h3 className="text-foreground text-xl tracking-tight text-balance">{title}</h3>
      </header>

      <div>
        <div className="flex flex-row flex-wrap gap-6 px-8 pb-4 justify-end">
          <div className="hidden xs:block">
            <TwoOptionToggle
              options={['SQL', 'chart']}
              activeOption={view}
              onClickOption={handleViewChange}
              borderOverride="border-overlay"
            />
          </div>
        </div>
        <motion.div
          key={view}
          className="overflow-hidden relative"
          initial={false}
          animate={{ height: isExpanded ? 'auto' : `${FIXED_HEIGHT}px` }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {!isAvailableForYear ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center">
              <p className="text-foreground-light text-balance">
                This question was added to the 2026 survey.
              </p>
              <p className="text-foreground-lighter text-sm text-balance">
                Switch the year to 2026 to view results.
              </p>
            </div>
          ) : view === 'chart' ? (
            <div className="flex flex-col h-full w-full justify-between px-8 pt-4 pb-12 min-h-[300px]">
              <div
                className="flex flex-col gap-10"
                style={{ height: isExpanded ? 'auto' : `${CHART_HEIGHT}px` }}
              >
                {chartData.map((item, index) => (
                  <div key={`${column}-${index}-${item.label}`} className="flex flex-col">
                    {/* Text above the bar */}
                    <div
                      className={`mb-2 flex flex-row justify-between text-sm font-mono uppercase tracking-widest tabular-nums transition-colors duration-300 ${
                        item.value === maxValue ? accentBarText : 'text-foreground'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span>{item.value < 1 ? '<1%' : `${item.value}%`}</span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-4 relative overflow-hidden"
                      style={
                        {
                          '--bar-value': item.value,
                          '--reference': maxValue,
                        } as React.CSSProperties
                      }
                    >
                      <div
                        className="absolute inset-0 pointer-events-none bg-foreground-muted/60"
                        style={{
                          maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
                          maskSize: '4px',
                          maskRepeat: 'repeat',
                          maskPosition: 'center',
                        }}
                      />
                      <div
                        className="h-full relative bg-surface-100"
                        style={{ width: `calc(max(0.5%, (var(--bar-value) / 100) * 100%))` }}
                      >
                        <div
                          className={`absolute inset-0 pointer-events-none ${item.value === maxValue ? accentBarFg : 'bg-foreground-light'}`}
                          style={{
                            maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
                            maskSize: '4px',
                            maskRepeat: 'repeat',
                            maskPosition: 'top left',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-8 pt-4 pb-8">
              <CodeBlock lang="sql">{sql}</CodeBlock>
            </div>
          )}

          {view === 'chart' && !isExpanded && chartData.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-linear-to-b from-transparent to-background">
              <Button
                variant="default"
                size="tiny"
                onClick={() => setIsExpanded(true)}
                className="shadow-xs"
              >
                Show more
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
