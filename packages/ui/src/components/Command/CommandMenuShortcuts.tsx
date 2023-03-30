import React from 'react'
import { IconArrowLeft } from '../Icon/icons/IconArrowLeft'

import { CommandShortcut } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'

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
    </div>
  )
}
