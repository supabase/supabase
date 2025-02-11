import { PropsWithChildren } from 'react'
import { cn } from 'ui'

export const ICON_SIZE = 20
export const ICON_STROKE_WIDTH = 1.5

interface Props {
  title?: string
  handleMobileMenu: Function
}

const MobileViewNav = ({ title, handleMobileMenu }: PropsWithChildren<Props>) => {
  return (
    <nav
      className={cn(
        'group px-4 z-10 w-full h-10',
        'border-b border-default',
        'transition-width duration-200',
        'flex md:hidden flex-row items-center gap-1 overflow-x-auto'
      )}
    >
      <button
        title="Menu dropdown button"
        className={cn(
          'group/view-toggle flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
        )}
        onClick={() => handleMobileMenu()}
      >
        <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
        <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
      </button>
      <div className="flex items-center">
        <h4 className="text-base">{title}</h4>
      </div>
    </nav>
  )
}

export default MobileViewNav
