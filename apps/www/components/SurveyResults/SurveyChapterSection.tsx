// import SectionContainer from '~/components/Layouts/SectionContainer'
import { SurveyStatCard } from './SurveyStatCard'
import { SurveyPullQuote } from './SurveyPullQuote'
import { SurveyWordCloud } from './SurveyWordCloud'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { SurveyRankedAnswersPair } from './SurveyRankedAnswersPair'

// Charts (TODO: delete unused)
import { AcceleratorParticipationChart } from './AcceleratorParticipationChart'
import { RoleChart } from './RoleChart'
import { IndustryChart } from './IndustryChart'
import { FundingStageChart } from './FundingStageChart'
import { DatabasesChart } from './DatabasesChart'
import { AIModelsChart } from './AIModelsChart'
// import { TeamCountChart } from '~/components/SurveyResults/TeamCountChart'
// import { TechnicalFoundersChart } from '~/components/SurveyResults/TechnicalFoundersChart'
// import { PreviousCompanyChart } from '~/components/SurveyResults/PreviousCompanyChart'
// import { FundingStageChart } from '~/components/SurveyResults/FundingStageChart'
import { HeadquartersChart } from '~/components/SurveyResults/HeadquartersChart'
// import { SurveyPullQuote } from '~/components/SurveyResults/SurveyPullQuote'
// import { SurveyStatCard } from '~/components/SurveyResults/SurveyStatCard'
// import { RoleChart } from '~/components/SurveyResults/RoleChart'
// import { ProblemBeingSolvedChart } from '~/components/SurveyResults/ProblemBeingSolvedChart'
// import { PersonAgeChart } from '~/components/SurveyResults/AgeChart'
// import { MonetizationChart } from '~/components/SurveyResults/MonetizationChart'
// import { AcceleratorParticipationChart } from '~/components/SurveyResults/AcceleratorParticipationChart'
// import { PivotFreqChart } from '~/components/SurveyResults/PivotFreqChart'
// import { FrontendStackChart } from '~/components/SurveyResults/FrontendStackChart'
// import { BackendStackChart } from '~/components/SurveyResults/BackendStackChart'
import { SalesToolsChart } from '~/components/SurveyResults/SalesToolsChart'
// import { PricingChart } from '~/components/SurveyResults/PricingChart'
// import { IndustryChart } from '~/components/SurveyResults/IndustryChart'
// import { DataWarehousesChart } from '~/components/SurveyResults/DataWarehousesChart'
// import { VectorDatabasesChart } from '~/components/SurveyResults/VectorDatabasesChart'
// import { OpenTelemetryChart } from '~/components/SurveyResults/OpenTelemetryChart'
// import { ObservabilityChart } from '~/components/SurveyResults/ObservabilityChart'
// import { CloudProvidersChart } from '~/components/SurveyResults/CloudProvidersChart'
// import { MustHaveDevToolsChart } from '~/components/SurveyResults/MustHaveDevToolsChart'
import { AICodingToolsChart } from './AICodingToolsChart'
// import { SubscriptionsChart } from '~/components/SurveyResults/SubscriptionsChart'
// import { NewslettersPaidForChart } from '~/components/SurveyResults/NewslettersPaidForChart'
// import { PodcastsListenedToChart } from '~/components/SurveyResults/PodcastsListenedToChart'
import { RegularSocialMediaUseChart } from '~/components/SurveyResults/RegularSocialMediaUseChart'
import { NewIdeasChart } from '~/components/SurveyResults/NewIdeasChart'
import { InitialPayingCustomersChart } from '~/components/SurveyResults/InitialPayingCustomersChart'
import { WorldOutlookChart } from '~/components/SurveyResults/WorldOutlookChart'
import { BiggestChallengeChart } from '~/components/SurveyResults/BiggestChallengeChart'

interface SurveyChapterSectionProps {
  number: string
  title: string
  description: string
  stats?: Array<{ number: number; unit: string; label: string }>
  charts?: string[]
  pullQuote?: {
    quote: string
    author: string
    authorPosition: string
    authorAvatar: string
  }
  wordCloud?: {
    label: string
    words: { text: string; count: number }[]
  }
  summarizedAnswer?: {
    label: string
    answers: string[]
  }
  rankedAnswersPair?: Array<{ label: string; answers: string[] }>
  children?: React.ReactNode
}

export function SurveyChapterSection({
  number,
  title,
  description,
  stats,
  charts,
  pullQuote,
  wordCloud,
  summarizedAnswer,
  rankedAnswersPair,
  children,
}: SurveyChapterSectionProps) {
  const chartComponents = {
    RoleChart,
    IndustryChart,
    FundingStageChart,
    AcceleratorParticipationChart,
    DatabasesChart,
    AICodingToolsChart,
    AIModelsChart,
    RegularSocialMediaUseChart,
    NewIdeasChart,
    InitialPayingCustomersChart,
    SalesToolsChart,
    WorldOutlookChart,
    BiggestChallengeChart,
    HeadquartersChart,
  }

  return (
    <div
      id={title.toLowerCase().replace(/\s+/g, '-')}
      className="flex flex-col gap-12 border-t border-muted pt-24 mt-24"
    >
      <header className="flex flex-col gap-3 text-center text-balance max-w-[48rem] mx-auto pb-12">
        <h3 className="text-brand-link dark:text-brand font-mono uppercase tracking-widest text-sm">
          {title}
        </h3>
        <p className="text-foreground text-xl leading-relaxed">{description}</p>
      </header>

      {stats && (
        <aside className="flex flex-row flex-wrap divide-x divide-muted divide-opacity-50">
          {stats.map((stat, index) => (
            <SurveyStatCard
              key={index}
              progressValue={stat.number}
              unit={stat.unit}
              label={stat.label}
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
        <SurveySummarizedAnswer label={summarizedAnswer.label} answers={summarizedAnswer.answers} />
      )}

      {children}
    </div>
  )
}
