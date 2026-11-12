import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { useState } from 'react'
import { Button } from 'ui'
import { expect, it } from 'vitest'

import { generateAdvisorsMenu } from './AdvisorsMenu.utils'
import { generateIssuesMenu } from '@/components/layouts/IssuesLayout/IssuesMenu.utils'
import { ShortcutsReferenceSheet } from '@/components/ui/GlobalShortcuts/ShortcutsReferenceSheet'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const ShortcutHost = ({ menu }: { menu: ProductMenuGroup[] }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ProductMenuShortcuts menu={menu} />
      <Button onClick={() => setOpen(true)}>Show shortcuts</Button>
      <ShortcutsReferenceSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

it.each([false, true])(
  'shows and runs the active navigation shortcuts: %s',
  async (issuesInbox) => {
    routerMock.setCurrentUrl(`/project/default/${issuesInbox ? 'issues' : 'advisors/security'}`)
    const generateMenu = issuesInbox ? generateIssuesMenu : generateAdvisorsMenu
    const menu = generateMenu({
      ref: 'default',
      isAdvisorRulesEnabled: false,
      isHealthAdvisorEnabled: true,
      isPlatform: false,
    })
    const user = userEvent.setup()
    customRender(
      <FeatureFlagContext.Provider value={{ configcat: { issuesInbox }, posthog: {} }}>
        <ShortcutHost menu={menu} />
      </FeatureFlagContext.Provider>
    )
    await user.click(screen.getByRole('button', { name: 'Show shortcuts' }))
    expect(
      await screen.findByText(issuesInbox ? 'Go to Security issues' : 'Go to Security Advisor')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: issuesInbox ? 'Issues Navigation' : 'Advisors Navigation',
      })
    ).toBeInTheDocument()
    const search = screen.getByLabelText('Search shortcuts')
    await user.click(search)
    await user.paste(issuesInbox ? 'Issues Navigation' : 'Advisors Navigation')
    expect(
      screen.getByText(issuesInbox ? 'Go to Health issues' : 'Go to Health Advisor')
    ).toBeInTheDocument()
    search.blur()
    await user.keyboard('vs')
    await waitFor(() =>
      expect(routerMock.asPath).toBe(
        issuesInbox
          ? '/project/default/issues?category=security'
          : '/project/default/advisors/security'
      )
    )
  }
)
