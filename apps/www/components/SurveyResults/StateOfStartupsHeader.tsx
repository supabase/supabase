import { ProgressBar } from './DecorativeProgressBar'

interface StateOfStartupsHeaderProps {
  title: string
  subtitle: string
  chapters: Array<{
    shortTitle: string
    number: number
  }>
  showProgressBars?: boolean
}

const DiagonalStripes = () => (
  <div
    className="flex-grow"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        hsl(var(--border-muted)) 0px,
        hsl(var(--border-muted)) 1px,
        transparent 1px,
        transparent 8px
      )`,
    }}
  />
)

const HeaderProgressBar = ({
  delay = 0,
  bgColor,
  progressBgColor = 'bg-foreground-muted/80',
  progressFgColor,
}: {
  delay?: number
  bgColor?: string
  progressBgColor?: string
  progressFgColor?: string
}) => (
  <div className="flex-grow">
    <ProgressBar
      className="h-full"
      backgroundClassName={progressBgColor}
      foregroundClassName={progressFgColor}
      animationDelay={`${delay}s`}
    />
  </div>
)

interface TextBlockProps {
  text: string
  bgColor: string
  textColor: string
  showProgressBar?: boolean
}

const TextBlock = ({
  text,
  bgColor,
  textColor,
  showProgressBar = true,
  delay = 0,
  progressBgColor,
  progressFgColor,
}: TextBlockProps & { delay?: number; progressBgColor?: string; progressFgColor?: string }) => (
  <div className="flex w-full items-stretch">
    <div className={`inline-block ${bgColor}`}>
      <span
        className={`${textColor} text-[4rem] px-5 py-3 inline-block leading-none tracking-tight`}
        // style={{ fontFamily: SUISSE_FONT_FAMILY }}
      >
        {text}
      </span>
    </div>
    {showProgressBar ? (
      <HeaderProgressBar
        delay={delay}
        bgColor={bgColor}
        progressBgColor={progressBgColor}
        progressFgColor={progressFgColor}
      />
    ) : (
      <DiagonalStripes />
    )}
  </div>
)

export function StateOfStartupsHeader({
  title,
  subtitle,
  chapters,
  showProgressBars = true,
}: StateOfStartupsHeaderProps) {
  return (
    <header className="mt-32">
      <div className="max-w-[60rem] mx-auto">
        <div className="flex flex-col gap-1">
          <TextBlock
            text="State"
            bgColor="bg-brand-300"
            textColor="text-brand"
            showProgressBar={showProgressBars}
            delay={0}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-200 dark:bg-brand-300"
          />
          <TextBlock
            text="of"
            bgColor="bg-brand-300"
            textColor="text-brand"
            showProgressBar={showProgressBars}
            delay={0.3}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-200 dark:bg-brand-300"
          />
          <TextBlock
            text="Startups"
            bgColor="bg-brand"
            textColor="text-background dark:text-brand-200"
            showProgressBar={showProgressBars}
            delay={0.6}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand dark:bg-brand"
          />
          <TextBlock
            text="2025"
            bgColor="bg-brand-500"
            textColor="text-foreground"
            showProgressBar={showProgressBars}
            delay={0.9}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-400 dark:bg-brand-500"
          />
        </div>
      </div>
    </header>
  )
}
