import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommandWrapper } from './CommandMenu'
import { CommandMenuList } from './CommandMenuList'
import { CommandProvider } from './CommandProvider'
import { useRegisterCommands } from './hooks/commandsHooks'

vi.mock('next/compat/router', () => ({
  useRouter: () => null,
}))

const SECTION = 'Related resources'
const FORCE_MOUNTED_SECTION = 'Tables'

const Harness = () => {
  useRegisterCommands(SECTION, [{ id: 'idx', name: 'blog_posts_pkey', action: () => {} }], {
    deps: [],
  })
  // The entity search filters in the database and force-mounts its results so
  // cmdk doesn't filter them again, which is a different mounting path
  useRegisterCommands(
    FORCE_MOUNTED_SECTION,
    [{ id: 'tbl', name: 'public.blog_posts', forceMount: true, action: () => {} }],
    { deps: [], forceMountSection: true }
  )
  return (
    <CommandWrapper>
      <CommandMenuList />
    </CommandWrapper>
  )
}

describe('command menu click telemetry', () => {
  it('reports which section surfaced the clicked command', async () => {
    const onTelemetry = vi.fn()
    render(
      <CommandProvider openKey="" onTelemetry={onTelemetry}>
        <Harness />
      </CommandProvider>
    )

    await userEvent.click(await screen.findByText('blog_posts_pkey'))

    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'command_menu_command_clicked',
        properties: expect.objectContaining({
          command_name: 'blog_posts_pkey',
          command_section: SECTION,
        }),
      })
    )
  })

  it('reports the section for force-mounted results, as the entity search uses', async () => {
    const onTelemetry = vi.fn()
    render(
      <CommandProvider openKey="" onTelemetry={onTelemetry}>
        <Harness />
      </CommandProvider>
    )

    await userEvent.click(await screen.findByText('public.blog_posts'))

    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'command_menu_command_clicked',
        properties: expect.objectContaining({
          command_name: 'public.blog_posts',
          command_section: FORCE_MOUNTED_SECTION,
        }),
      })
    )
  })
})
