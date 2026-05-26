'use client'

import { useAccent } from './accent-context'
import { AcceleratorParticipationChart } from './charts/AcceleratorParticipationChart'
import { AICodebasePercentChart } from './charts/AICodebasePercentChart'
import { AICodingToolsChart } from './charts/AICodingToolsChart'
import { AIModelsChart } from './charts/AIModelsChart'
import { AuthProviderChart } from './charts/AuthProviderChart'
import { BiggestChallengeChart } from './charts/BiggestChallengeChart'
import { BuildingAgentsChart } from './charts/BuildingAgentsChart'
import { DatabasesChart } from './charts/DatabasesChart'
import { FundingStageChart } from './charts/FundingStageChart'
import { IndustryChart } from './charts/IndustryChart'
import { InitialPayingCustomersChart } from './charts/InitialPayingCustomersChart'
import { LocationChart } from './charts/LocationChart'
import { MCPAdoptionChart } from './charts/MCPAdoptionChart'
import { NewIdeasChart } from './charts/NewIdeasChart'
import { PaidSubscriptionsChart } from './charts/PaidSubscriptionsChart'
import { RegularSocialMediaUseChart } from './charts/RegularSocialMediaUseChart'
import { RoleChart } from './charts/RoleChart'
import { SalesToolsChart } from './charts/SalesToolsChart'
import { WorldOutlookChart } from './charts/WorldOutlookChart'
import { SurveyPullQuote } from './SurveyPullQuote'
import { SurveyRankedAnswersPair } from './SurveyRankedAnswersPair'
import { SurveySectionBreak } from './SurveySectionBreak'
import { SurveyStatCard, type SurveyStatSource } from './SurveyStatCard'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { SurveyWordCloud } from './SurveyWordCloud'
import { useYear, type SurveyYear } from './year-context'

interface SurveyChapterSectionProps {
  title: string
  description: string
  stats?: Array<{ percent: number; label: string; source?: SurveyStatSource }>
  charts?: string[]

  wordCloud?: {
    label: string
    words: { text: string; count: number }[]
  }
  summarizedAnswer?: {
    label: string
    answers: string[]
  }
  rankedAnswersPair?: Array<{ label: string; answers: string[] }>
  pullQuote?: {
    quote: string
    author: string
    authorPosition?: string
    authorAvatar?: string
  }
  /**
   * Set when an entire section's data first appeared in a given survey year.
   * If the user toggles the page to an earlier year, the section body is
   * replaced with a "Not available in <prior year>" placeholder while the
   * title and description still render.
   */
  newInYear?: SurveyYear
  children?: React.ReactNode
}

export function SurveyChapterSection({
  title,
  description,
  stats,
  charts,
  wordCloud,
  summarizedAnswer,
  rankedAnswersPair,
  pullQuote,
  newInYear,
  children,
}: SurveyChapterSectionProps) {
  const accent = useAccent()
  const { year } = useYear()
  const isAvailableForYear = !newInYear || year >= newInYear

  const eyebrowColor = 'text-brand-link dark:text-brand'

  const chartComponents = {
    AcceleratorParticipationChart,
    AICodebasePercentChart,
    AICodingToolsChart,
    AIModelsChart,
    AuthProviderChart,
    BiggestChallengeChart,
    BuildingAgentsChart,
    DatabasesChart,
    FundingStageChart,
    IndustryChart,
    InitialPayingCustomersChart,
    LocationChart,
    MCPAdoptionChart,
    NewIdeasChart,
    PaidSubscriptionsChart,
    RegularSocialMediaUseChart,
    RoleChart,
    SalesToolsChart,
    WorldOutlookChart,
  }

  return (
    <div id={title.toLowerCase().replace(/\s+/g, '-')} className="">
      <div className="max-w-240 mx-auto flex flex-col md:border-x border-muted">
        <header className="grid grid-cols-1 md:grid-cols-3 text-balance">
          <h3
            className={`pt-8 pb-4 px-8 md:border-r border-muted font-mono uppercase tracking-wider text-sm ${eyebrowColor}`}
          >
            {title}
          </h3>
          <p className="pb-8 md:pt-8 px-8 md:col-span-2 text-foreground-light text-lg md:text-xl leading-relaxed">
            {description}
          </p>
        </header>

        {isAvailableForYear ? (
          <>
            {stats && (
              <aside className="border-t border-muted flex flex-col xs:flex-row flex-wrap divide-y xs:divide-x xs:divide-y-0 divide-muted">
                {stats.map((stat, index) => (
                  <SurveyStatCard
                    key={index}
                    percent={stat.percent}
                    label={stat.label}
                    source={stat.source}
                  />
                ))}
              </aside>
            )}

            {charts?.map((chartName, index) => {
              const ChartComponent = chartComponents[chartName as keyof typeof chartComponents]
              return ChartComponent ? <ChartComponent key={index} /> : null
            })}

            {rankedAnswersPair && <SurveyRankedAnswersPair rankedAnswersPair={rankedAnswersPair} />}

            {wordCloud && <SurveyWordCloud label={wordCloud.label} answers={wordCloud.words} />}

            {summarizedAnswer && (
              <SurveySummarizedAnswer
                label={summarizedAnswer.label}
                answers={summarizedAnswer.answers}
              />
            )}

            {children}
          </>
        ) : (
          <div className="border-t border-muted px-8 py-16 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-foreground-light text-balance">Not available in {year}.</p>
            <p className="text-foreground-lighter text-sm text-balance">
              This question was added to the {newInYear} survey. Switch the year toggle to{' '}
              {newInYear} to view.
            </p>
          </div>
        )}
      </div>

      {pullQuote && isAvailableForYear && (
        <SurveyPullQuote
          quote={pullQuote.quote}
          author={pullQuote.author}
          authorPosition={pullQuote.authorPosition}
          authorAvatar={pullQuote.authorAvatar}
        />
      )}

      <SurveySectionBreak />
    </div>
  )
}
