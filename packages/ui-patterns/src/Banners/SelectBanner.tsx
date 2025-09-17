import Link from 'next/link'
import { Button } from 'ui/src/components/Button'
import announcement from './data.json'

export function SelectBanner() {
  return (
    <div className="relative w-full p-4 flex items-center group justify-center text-foreground-contrast dark:text-white bg-black border-b border-muted transition-colors overflow-hidden ">
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm">
          <Link target={announcement.target ?? '_self'} href={announcement.link}>
            <img src="/images/select/supabase-select.svg" alt="Supabase Select" className="w-32" />
          </Link>

          <p className="text-sm hidden sm:block">
            {announcement.desc}
            <span className="hidden xl:inline">{announcement.verbose}</span>
          </p>

          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link target={announcement.target ?? '_self'} href={announcement.link}>
              {announcement.button}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SelectBanner
