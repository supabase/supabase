import { motion } from 'framer-motion'
import Link from 'next/link'

interface StateOfStartupsHeaderProps {
  title: string
  subtitle: string
  chapters: Array<{
    shortTitle: string
    number: number
  }>
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

interface TextBlockProps {
  text: string
  bgColor: string
  textColor: string
}

const TextBlock = ({ text, bgColor, textColor }: TextBlockProps) => (
  <div className="flex w-full">
    <div className={`inline-block ${bgColor}`}>
      <span
        className={`${textColor} text-[4rem] px-5 py-3 inline-block leading-none tracking-tight`}
        // style={{ fontFamily: SUISSE_FONT_FAMILY }}
      >
        {text}
      </span>
    </div>
    <DiagonalStripes />
  </div>
)

export function StateOfStartupsHeader({ title, subtitle, chapters }: StateOfStartupsHeaderProps) {
  return (
    <header className="mt-32">
      <div className="max-w-[60rem] mx-auto">
        <div className="flex flex-col gap-1">
          <TextBlock text="State" bgColor="bg-surface-300" textColor="text-foreground-lighter" />
          <TextBlock text="of" bgColor="bg-surface-300" textColor="text-foreground-lighter" />
          <TextBlock text="Startups" bgColor="bg-brand" textColor="text-brand-200" />
          <TextBlock text="2025" bgColor="bg-foreground" textColor="text-background" />
        </div>
      </div>
    </header>
  )
}
