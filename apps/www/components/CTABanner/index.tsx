import { Button } from 'ui'

interface Props {
  className?: string
  darkerBg?: boolean
}

const CTABanner = ({ darkerBg, className }: Props) => {
  return (
    <div
      className={[
        `bg-background grid grid-cols-12 items-center gap-4 border-t py-32 text-center px-16`,
        darkerBg && 'bg-alternative',
        className,
      ].join(' ')}
    >
      <div className="col-span-12">
        <h2 className="h2">
          <span className="text-muted">Build in a weekend,</span>
          <span className="text-foreground block sm:inline"> scale to millions</span>
        </h2>
      </div>
      <div className="col-span-12 mt-4">
        <a href="https://supabase.com/dashboard">
          <Button size="medium" className="text-white">
            Start your project
          </Button>
        </a>
      </div>
    </div>
  )
}

export default CTABanner
