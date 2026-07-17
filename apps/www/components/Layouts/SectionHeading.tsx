import { cn } from 'ui'

export interface SectionEyebrowProps {
  eyebrow?: string
  title: string | React.ReactNode
  description?: string
  align?: 'left' | 'center'
  className?: string
}

const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionEyebrowProps) => (
  <div
    className={cn(
      align === 'center' ? 'flex flex-col items-center text-center gap-3' : 'flex flex-col gap-3',
      className
    )}
  >
    {eyebrow && (
      <span className="text-brand font-mono text-sm uppercase tracking-wide">{eyebrow}</span>
    )}
    <h2 className="text-foreground text-3xl md:text-4xl tracking-tight max-w-[35ch] text-balance">
      {title}
    </h2>
    {description && (
      <p className="text-foreground-lighter text-lg max-w-[56ch] text-pretty">{description}</p>
    )}
  </div>
)

export default SectionHeading
