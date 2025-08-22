import { SurveyStatCard } from './SurveyStatCard'
import { SurveyWordCloud } from './SurveyWordCloud'
import { SurveySummarizedAnswer } from './SurveySummarizedAnswer'
import { SurveyRankedAnswersPair } from './SurveyRankedAnswersPair'
import { SurveySectionBreak } from './SurveySectionBreak'
import { SurveyChart } from './SurveyChart'
import { CHART_CONFIGS } from './chartConfigs'

interface SurveyChapterSectionProps {
  title: string
  description: string
  stats?: Array<{ percent: number; label: string }>
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
  children,
}: SurveyChapterSectionProps) {
  return (
    <div id={title.toLowerCase().replace(/\s+/g, '-')} className="">
      <div className="max-w-[60rem] mx-auto flex flex-col md:border-x border-muted">
        <header className="grid grid-cols-1 md:grid-cols-3 text-balance">
          <h3 className="pt-8 pb-4 px-8 md:border-r border-muted text-brand-link dark:text-brand font-mono uppercase tracking-wider text-sm">
            {title}
          </h3>
          <p className="pb-8 md:pt-8 px-8 md:col-span-2 text-foreground-light text-lg md:text-xl leading-relaxed">
            {description}
          </p>
        </header>

        {stats && (
          <aside className="border-t border-muted flex flex-col xs:flex-row flex-wrap divide-y xs:divide-x xs:divide-y-0 divide-muted">
            {stats.map((stat, index) => (
              <SurveyStatCard key={index} percent={stat.percent} label={stat.label} />
            ))}
          </aside>
        )}

        {charts?.map((chartId, index) => {
          const config = CHART_CONFIGS.find((c) => c.id === chartId)
          return config ? <SurveyChart key={chartId} {...config} /> : null
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
