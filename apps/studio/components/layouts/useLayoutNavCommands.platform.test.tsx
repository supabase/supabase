import { screen } from '@testing-library/react'
import { AuthProvider, FeatureFlagContext } from 'common'
import { useCommands } from 'ui-patterns/CommandMenu'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLayoutNavCommands } from './useLayoutNavCommands'
import { customRender } from '@/tests/lib/custom-render'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const NavigationCommands = () => {
  useLayoutNavCommands()
  const sections = useCommands()
  return (
    <ul>
      {sections.flatMap((section) =>
        section.commands.map((command) => (
          <li key={command.id}>
            {'route' in command ? <a href={command.route}>{command.name}</a> : command.name}
          </li>
        ))
      )}
    </ul>
  )
}

describe('Issues command discovery', () => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
  })
  it.each([false, undefined, true])(
    'registers Issues commands only when enabled: %s',
    async (issuesInbox) => {
      customRender(
        <AuthProvider alwaysLoggedIn>
          <FeatureFlagContext.Provider
            value={{
              configcat: {
                ...(issuesInbox === undefined ? {} : { issuesInbox }),
                compute: false,
                healthAdvisor: true,
                platformWebhooks: false,
                ConfigDrift: false,
              },
              posthog: {},
            }}
          >
            <NavigationCommands />
          </FeatureFlagContext.Provider>
        </AuthProvider>
      )

      expect(await screen.findByText('Table Editor')).toBeInTheDocument()
      for (const name of ['Issues', 'Security issues', 'Performance issues', 'Health issues']) {
        expect(screen.queryByText(name) !== null).toBe(!!issuesInbox)
      }
      for (const [name, category] of [
        ['Security Advisor', 'security'],
        ['Performance Advisor', 'performance'],
        ['Health Advisor', 'health'],
      ]) {
        if (issuesInbox) expect(screen.queryByRole('link', { name })).not.toBeInTheDocument()
        else
          expect(screen.getByRole('link', { name })).toHaveAttribute(
            'href',
            `/project/default/advisors/${category}`
          )
      }
    }
  )
})
