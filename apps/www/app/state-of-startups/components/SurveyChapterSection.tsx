'use client'

import type { SurveySection } from '~/data/surveys/state-of-startups-2026'
import { useMemo, useState } from 'react'

import { getDistribution } from '../lib/survey-keys'
import type { Aggregation, SurveyFilters } from '../lib/survey-keys'
import { CohortToggle } from './CohortToggle'
import { SectionCallout } from './SectionCallout'
import { SurveyChannelMixChart } from './SurveyChannelMixChart'
import { SurveyChart } from './SurveyChart'
import { SurveyCrossTabChart } from './SurveyCrossTabChart'
import { SurveyPullQuote } from './SurveyPullQuote'
import { SurveyPullQuoteGrid } from './SurveyPullQuoteGrid'
import { SurveyRankedAnswersPair } from './SurveyRankedAnswersPair'
import { SurveySectionBreak } from './SurveySectionBreak'
import { SurveyStatCard } from './SurveyStatCard'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { SurveyWordCloud } from './SurveyWordCloud'
import { YearProvider } from './year-context'
import { YearToggle } from './YearToggle'

export function SurveyChapterSection({ section }: { section: SurveySection }) {
  const {
    id,
    eyebrow,
    title,
    description,
    statsHeading,
    stats,
    charts,
    pullQuote,
    pullQuotes,
    cohortToggle,
    callout,
    wordCloud,
    summarizedAnswer,
    rankedAnswersPair,
  } = section

  const [cohortLabel, setCohortLabel] = useState(cohortToggle?.defaultLabel ?? '')

  // The active cohort toggle option merges its filter into every stat and bar
  // chart in the section. Cross-tab and channel-mix carry their own cohorts.
  const cohortFilter: SurveyFilters | undefined = useMemo(() => {
    if (!cohortToggle) return undefined
    const option = cohortToggle.options.find((o) => o.label === cohortLabel)
    if (!option || option.filter === null) return undefined
    return { [cohortToggle.key]: option.filter }
  }, [cohortToggle, cohortLabel])

  const eyebrowColor = 'text-brand-link dark:text-brand'

  // A section can be compared across years only if it has any 2025 data. New-in-
  // 2026 questions (share of codebase, auth, agents, MCP, the AI-codebase
  // cross-tabs) have no 2025 baseline, so we hide the year toggle for them.
  const hasComparison = useMemo(() => {
    const probe = (col: string, agg: Aggregation, f?: SurveyFilters) =>
      getDistribution(2025, col, agg, f) !== undefined
    if (stats.some((s) => s.query && probe(s.query.column, s.query.aggregation, s.query.filters)))
      return true
    return charts.some((c) => {
      if (c.kind === 'cross-tab') {
        return c.cohorts.some((co) =>
          c.series.some((s) =>
            probe(s.query.column, s.query.aggregation, { [c.axisColumn]: co.filter })
          )
        )
      }
      if (c.kind === 'channel-mix') {
        return c.cohorts.some((co) => probe(c.column, 'multi', { [c.cohortColumn]: co.filter }))
      }
      return probe(c.column, c.aggregation, c.filters)
    })
  }, [stats, charts])

  // Each section keeps its own 2025/2026 state so a reader can compare a single
  // section's stats and charts without affecting the rest of the page.
  return (
    <YearProvider defaultYear={2026}>
      <div id={id} className="">
        <div className="max-w-240 mx-auto flex flex-col md:border-x border-muted">
          <header className="grid grid-cols-1 md:grid-cols-3 text-balance">
            <div className="pt-8 pb-4 px-8 md:border-r border-muted flex flex-col gap-2">
              <h3 className={`font-mono uppercase tracking-wider text-sm ${eyebrowColor}`}>
                {eyebrow}
              </h3>
              <p className="text-foreground text-lg tracking-tight">{title}</p>
            </div>
            <p className="pb-8 md:pt-8 px-8 md:col-span-2 text-foreground-light text-lg md:text-xl leading-relaxed">
              {description}
            </p>
          </header>

          {/* Section-level year comparison control, sitting just above the data.
              Hidden for new-in-2026 sections that have no 2025 baseline. */}
          {hasComparison && (
            <div className="flex items-center justify-between gap-4 px-8 py-3 border-t border-muted">
              <span className="text-foreground-lighter text-xs font-mono uppercase tracking-widest">
                Compare year
              </span>
              <YearToggle className="shrink-0 shadow-none" />
            </div>
          )}

          {cohortToggle && (
            <CohortToggle
              eyebrow={cohortToggle.eyebrow}
              options={cohortToggle.options}
              value={cohortLabel}
              onValueChange={setCohortLabel}
            />
          )}

          {/* Optional question header describing the stat cards below as the
              answer to a specific survey question. */}
          {statsHeading && (
            <header className="px-8 pt-8 pb-2 border-t border-muted flex flex-col gap-1">
              <p className="text-foreground/30 text-sm font-mono uppercase tracking-widest">
                {'Q&A'}
              </p>
              <h3 className="text-foreground text-xl tracking-tight text-balance">
                {statsHeading.title}
                {statsHeading.note && (
                  <span className="ml-2 text-sm font-normal text-foreground-light">
                    ({statsHeading.note})
                  </span>
                )}
              </h3>
            </header>
          )}

          {stats.length > 0 && (
            <aside
              className={`${statsHeading ? '' : 'border-t border-muted'} flex flex-col xs:flex-row flex-wrap divide-y xs:divide-x xs:divide-y-0 divide-muted`}
            >
              {stats.map((stat, index) => (
                <SurveyStatCard
                  key={index}
                  label={stat.label}
                  query={stat.query}
                  value={stat.value}
                  cohortFilter={cohortFilter}
                />
              ))}
            </aside>
          )}

          {charts.map((chart, index) => {
            if (chart.kind === 'cross-tab') {
              return (
                <SurveyCrossTabChart
                  key={index}
                  title={chart.title}
                  eyebrow={chart.eyebrow}
                  axisColumn={chart.axisColumn}
                  xAxisLabel={chart.xAxisLabel}
                  yAxisLabel={chart.yAxisLabel}
                  cohorts={chart.cohorts}
                  series={chart.series}
                />
              )
            }
            if (chart.kind === 'channel-mix') {
              return (
                <SurveyChannelMixChart
                  key={index}
                  title={chart.title}
                  eyebrow={chart.eyebrow}
                  column={chart.column}
                  cohortColumn={chart.cohortColumn}
                  cohorts={chart.cohorts}
                  rows={chart.rows}
                />
              )
            }
            return (
              <SurveyChart
                key={index}
                title={chart.title}
                note={chart.note}
                column={chart.column}
                aggregation={chart.aggregation}
                filters={chart.filters}
                cohortFilter={cohortFilter}
                maxBars={chart.maxBars}
              />
            )
          })}

          {rankedAnswersPair && rankedAnswersPair.length > 0 && (
            <SurveyRankedAnswersPair rankedAnswersPair={rankedAnswersPair} />
          )}

          {wordCloud && <SurveyWordCloud label={wordCloud.label} answers={wordCloud.words} />}

          {summarizedAnswer && (
            <SurveySummarizedAnswer
              label={summarizedAnswer.label}
              answers={summarizedAnswer.answers}
            />
          )}

          {callout && <SectionCallout {...callout} />}
        </div>

        {pullQuote && (
          <SurveyPullQuote
            quote={pullQuote.quote}
            author={pullQuote.author}
            authorPosition={pullQuote.authorPosition}
          />
        )}

        {pullQuotes && pullQuotes.length > 0 && <SurveyPullQuoteGrid quotes={pullQuotes} />}

        <SurveySectionBreak />
      </div>
    </YearProvider>
  )
}
