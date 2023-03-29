import React from 'react'
import { CommandShortcut } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'

export default function CommandMenuShortcuts() {
  const { setPages, pages } = useCommandMenu()
  return (
    <div className="flex w-full gap-2 px-4 pt-4 justify-items-start flex-row">
      <CommandShortcut onClick={() => setPages([])}>{'Home'}</CommandShortcut>
      {pages.map((page, index) => (
        <CommandShortcut
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
