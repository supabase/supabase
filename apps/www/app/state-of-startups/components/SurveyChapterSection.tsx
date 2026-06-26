'use client'

import type { SurveySection } from '~/data/surveys/state-of-startups-2026'
import { useMemo, useState } from 'react'

import type { SurveyFilters } from '../lib/survey-keys'
import { CohortToggle } from './CohortToggle'
import { SectionCallout } from './SectionCallout'
import { SurveyChannelMixChart } from './SurveyChannelMixChart'
import { SurveyChart } from './SurveyChart'
import { SurveyCrossTabChart } from './SurveyCrossTabChart'
import { SurveyPullQuote } from './SurveyPullQuote'
import { SurveyPullQuoteGrid } from './SurveyPullQuoteGrid'
import { SurveySectionBreak } from './SurveySectionBreak'
import { SurveyStatCard } from './SurveyStatCard'

export function SurveyChapterSection({ section }: { section: SurveySection }) {
  const {
    id,
    eyebrow,
    title,
    description,
    stats,
    charts,
    pullQuote,
    pullQuotes,
    cohortToggle,
    callout,
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

  return (
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

        {cohortToggle && (
          <CohortToggle
            eyebrow={cohortToggle.eyebrow}
            options={cohortToggle.options}
            value={cohortLabel}
            onValueChange={setCohortLabel}
          />
        )}

        {stats.length > 0 && (
          <aside className="border-t border-muted flex flex-col xs:flex-row flex-wrap divide-y xs:divide-x xs:divide-y-0 divide-muted">
            {stats.map((stat, index) => (
              <SurveyStatCard
                key={index}
                label={stat.label}
                query={stat.query}
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
              column={chart.column}
              aggregation={chart.aggregation}
              filters={chart.filters}
              cohortFilter={cohortFilter}
              maxBars={chart.maxBars}
            />
          )
        })}

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
  )
}
