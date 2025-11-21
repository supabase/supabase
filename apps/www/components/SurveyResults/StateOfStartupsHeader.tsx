import { useMemo } from 'react'
import { ProgressBar } from './DecorativeProgressBar'

interface StateOfStartupsHeaderProps {
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
  progressBgColor = 'bg-foreground-muted/80',
  progressFgColor,
}: {
  delay?: number
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
        className={`${textColor} text-[2rem] md:text-[4rem] px-2.5 md:px-8 py-1.5 md:py-3 inline-block leading-none tracking-tight`}
      >
        {text}
      </span>
    </div>
    {showProgressBar ? (
      <HeaderProgressBar
        delay={delay}
        progressBgColor={progressBgColor}
        progressFgColor={progressFgColor}
      />
    ) : (
      <DiagonalStripes />
    )}
  </div>
)

export function StateOfStartupsHeader({ showProgressBars = true }: StateOfStartupsHeaderProps) {
  // Generate stable random delays between 0.2 and 2 seconds for each TextBlock
  const randomDelays = useMemo(
    () => [
      0.2 + Math.random() * 1.8,
      0.2 + Math.random() * 1.8,
      0.2 + Math.random() * 1.8,
      0.2 + Math.random() * 1.8,
    ],
    []
  )

  return (
    <header className="mt-16 md:mt-32">
      <div className="max-w-[60rem] ml-8 md:mx-auto">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <h1 className="sr-only">State of Startups 2025</h1>
          <TextBlock
            text="State"
            bgColor="bg-brand-300"
            textColor="text-brand"
            showProgressBar={showProgressBars}
            delay={randomDelays[0]}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-300"
          />
          <TextBlock
            text="of"
            bgColor="bg-brand-300"
            textColor="text-brand"
            showProgressBar={showProgressBars}
            delay={randomDelays[1]}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-300"
          />
          <TextBlock
            text="Startups"
            bgColor="bg-brand"
            textColor="text-background dark:text-brand-200"
            showProgressBar={showProgressBars}
            delay={randomDelays[2]}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand dark:bg-brand"
          />
          <TextBlock
            text="2025"
            bgColor="bg-brand-500"
            textColor="text-brand-300"
            showProgressBar={showProgressBars}
            delay={randomDelays[3]}
            progressBgColor="bg-surface-400 dark:bg-surface-300"
            progressFgColor="bg-brand-500"
          />
        </div>
      </div>
    </header>
  )
}
