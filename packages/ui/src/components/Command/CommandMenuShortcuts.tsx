import React from 'react'
import { IconArrowLeft } from '../Icon/icons/IconArrowLeft'

import { CommandShortcut } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
import { COMMAND_ROUTES } from './Command.constants'

export default function CommandMenuShortcuts() {
  const { setPages, pages, currentPage } = useCommandMenu()

  return (
    <div className="flex w-full gap-2 px-4 pt-4 justify-items-start flex-row items-center">
      <CommandShortcut onClick={() => setPages([])}>
        <div className="flex items-center gap-2">
          <IconArrowLeft width={15} height={15} />
        </div>
      </CommandShortcut>

      {pages.map((page, index) => (
        <CommandShortcut
          type={page === currentPage ? 'breadcrumb' : 'default'}
          key={page}
          onClick={() => {
            if (index === pages.length - 1) {
              return
            }
            setPages(pages.slice(0, index - 1))
          }}
        >
          {page}
        </CommandShortcut>
      ))}

      {currentPage && isExperimental(currentPage) && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 bg-brand-200 text-brand-1100 border border-brand-700">
          Experimental
        </span>
      )}
    </div>
  )
}

/**
 * TODO: remove this function and store this info on each page
 * Temporary function to determine whether or not to show 'Experimental' badge
 */
function isExperimental(page: string) {
  switch (page) {
    case COMMAND_ROUTES.AI:
    case COMMAND_ROUTES.GENERATE_SQL:
      return true
    default:
      return false
  }
}
