import SectionContainer from '~/components/Layouts/SectionContainer'
import { SurveyStatWrapper } from './SurveyStatWrapper'
import { SurveyStatCard } from './SurveyStatCard'
import { SurveyPullQuote } from './SurveyPullQuote'
import { SurveyWordCloud } from './SurveyWordCloud'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { RoleChart } from './RoleChart'
import { IndustryChart } from './IndustryChart'
import { FundingStageChart } from './FundingStageChart'

interface SurveySectionProps {
  number: number
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

export function SurveySection({
  number,
  title,
  description,
  children,
  className,
}: SurveySectionProps) {
  return (
    <SectionContainer
      className={`flex flex-col gap-12 border-t border-default pt-12 ${className || ''}`}
    >
      <header className="flex flex-col gap-2">
        <aside className="text-brand font-mono uppercase tracking-widest text-sm">
          {number} / 7
        </aside>
        <h2 className="heading-gradient text-3xl sm:text-3xl xl:text-5xl text-balance leading-tight">
          {title}
        </h2>
        <p className="text-lg text-foreground-light sm:text-xl xl:text-2xl text-balance">
          {description}
        </p>
      </header>
      <div className="flex flex-col gap-16">{children}</div>
    </SectionContainer>
  )
}

interface SurveySubSectionProps {
  number: number
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
    answers: string[]
  }
  summarizedAnswer?: {
    label: string
    answers: string[]
  }
  children?: React.ReactNode
  className?: string
}

export function SurveySubSection({
  number,
  title,
  description,
  stats,
  charts,
  pullQuote,
  wordCloud,
  summarizedAnswer,
  children,
  className,
}: SurveySubSectionProps) {
  const chartComponents = {
    RoleChart,
    IndustryChart,
    FundingStageChart,
    // ... add as needed
  }

  return (
    <div className={`flex flex-col gap-8 md:gap-12 ${className || ''}`}>
      <header className="flex flex-col gap-3">
        <h3 className="text-brand font-mono uppercase tracking-widest text-sm">
          {number} {title}
        </h3>
        <p className="text-foreground text-xl text-balance leading-relaxed">{description}</p>
      </header>

      <div className="flex flex-col gap-8">
        {stats && (
          <SurveyStatWrapper>
            {stats.map((stat, index) => (
              <SurveyStatCard
                key={index}
                number={stat.number}
                unit={stat.unit}
                label={stat.label}
              />
            ))}
          </SurveyStatWrapper>
        )}

        {charts?.map((chartName, index) => {
          const ChartComponent = chartComponents[chartName as keyof typeof chartComponents]
          return ChartComponent ? <ChartComponent key={index} /> : null
        })}

        {wordCloud && <SurveyWordCloud label={wordCloud.label} answers={wordCloud.answers} />}

        {summarizedAnswer && (
          <SurveySummarizedAnswer
            label={summarizedAnswer.label}
            answers={summarizedAnswer.answers}
          />
        )}

        {pullQuote && (
          <SurveyPullQuote
            quote={pullQuote.quote}
            author={pullQuote.author}
            authorPosition={pullQuote.authorPosition}
            authorAvatar={pullQuote.authorAvatar}
          />
        )}

        {children}
      </div>
    </div>
  )
}
