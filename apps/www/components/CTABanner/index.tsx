import { Button } from 'ui'

interface Props {
  className?: string
  darkerBg?: boolean
}

const CTABanner = ({ darkerBg, className }: Props) => {
  return (
    <div
      className={[
        `bg-scale-200 grid grid-cols-12 items-center gap-4 border-t py-32 text-center px-16`,
        darkerBg && 'dark:bg-dark-900',
        className,
      ].join(' ')}
    >
      <div className="col-span-12">
        <h2 className="h2">
          <span className="text-scale-900">Build in a weekend,</span>
          <span className="text-scale-1200 dark:text-white block sm:inline">
            {' '}
            scale to millions
          </span>
        </h2>
      </div>
      <div className="col-span-12 mt-4">
        <Button size="medium" className="text-white" asChild>
          <a href="https://supabase.com/dashboard">Start your project</a>
        </Button>
      </div>
    </div>
  )
}

export default CTABanner
