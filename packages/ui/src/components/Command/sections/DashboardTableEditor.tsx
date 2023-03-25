import { useRouter } from 'next/router'
import * as React from 'react'
import { IconArrowRight } from '../../Icon/icons/IconArrowRight'
import dashboardItems from '../utils/dashboard-nav-items.json'
import { CommandGroup, CommandItem, CommandLabel, CommandList } from '../Command.utils'
import { useCommandMenu } from '../CommandMenuProvider'

export default function DashboardTableEditor() {
  const router = useRouter()
  const { setPages, currentPage, pages } = useCommandMenu()

  return (
    <CommandGroup heading={dashboardItems.tools.label}>
      <CommandList>
        {!currentPage && (
          <>
            <CommandItem type="command" onSelect={() => setPages([...pages, 'projects'])}>
              Search projects…
            </CommandItem>
            <CommandItem type="command" onSelect={() => setPages([...pages, 'teams'])}>
              Join a team…
            </CommandItem>
          </>
        )}

        {currentPage === 'projects' && (
          <>
            <CommandItem type="link">Project B</CommandItem>
          </>
        )}

        {currentPage === 'teams' && (
          <>
            <CommandItem type="link">Team 1</CommandItem>
            <CommandItem type="link">Team 2</CommandItem>
          </>
        )}
      </CommandList>
      {/* {dashboardItems.tools.items.map((item) => (
        <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
          <IconArrowRight className="text-scale-900" />
          <CommandLabel>
            Go to <span className="font-bold"> {item.label}</span>
          </CommandLabel>
        </CommandItem>
      ))} */}
    </CommandGroup>
  )
}
