import { SurveyStatCard } from './SurveyStatCard'
import { SurveyWordCloud } from './SurveyWordCloud'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { SurveyRankedAnswersPair } from './SurveyRankedAnswersPair'
import { SurveySectionBreak } from './SurveySectionBreak'
import { AcceleratorParticipationChart } from './AcceleratorParticipationChart'
import { RoleChart } from './RoleChart'
import { IndustryChart } from './IndustryChart'
import { FundingStageChart } from './FundingStageChart'
import { DatabasesChart } from './DatabasesChart'
import { AIModelsChart } from './AIModelsChart'
import { HeadquartersChart } from '~/components/SurveyResults/HeadquartersChart'
import { SalesToolsChart } from '~/components/SurveyResults/SalesToolsChart'
import { AICodingToolsChart } from './AICodingToolsChart'
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
    <div id={title.toLowerCase().replace(/\s+/g, '-')} className="">
      <div className="max-w-[60rem] mx-auto flex flex-col md:border-x border-muted">
        <header className="grid grid-cols-1 md:grid-cols-3 text-balance">
          <h3 className="py-8 px-8 md:border-r border-muted text-brand-link dark:text-brand font-mono uppercase tracking-widest text-sm">
            {title}
          </h3>
          <p className="py-8 px-8 md:col-span-2 text-foreground-light text-xl leading-relaxed">
            {description}
          </p>
        </header>

        {stats && (
          <aside className="border-t border-muted flex flex-row flex-wrap divide-x divide-muted">
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
          <SurveySummarizedAnswer
            label={summarizedAnswer.label}
            answers={summarizedAnswer.answers}
          />
        )}

        {children}
      </div>

      <SurveySectionBreak />
    </div>
  )
}
