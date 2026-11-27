import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import { DocsButton } from './DocsButton'
import { customRender } from '@/tests/lib/custom-render'

const { track } = vi.hoisted(() => ({ track: vi.fn() }))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => track }))

beforeEach(() => {
  track.mockClear()
})

test('clicking tracks once with the topic', async () => {
  const user = userEvent.setup()
  customRender(<DocsButton href="https://supabase.com/docs/guides/auth" topic="Auth" />)

  await user.click(screen.getByRole('link', { name: /auth documentation/i }))

  expect(track).toHaveBeenCalledTimes(1)
  expect(track).toHaveBeenCalledWith('docs_button_clicked', { topic: 'Auth' })
})

test('clicking without a topic omits the topic property', async () => {
  const user = userEvent.setup()
  customRender(<DocsButton href="https://supabase.com/docs/guides/auth" />)

  await user.click(screen.getByRole('link', { name: 'Docs' }))

  expect(track).toHaveBeenCalledTimes(1)
  expect(track).toHaveBeenCalledWith('docs_button_clicked', {})
})

test('clicking does not bubble to a clickable parent', async () => {
  const user = userEvent.setup()
  const onParentClick = vi.fn()
  customRender(
    <div onClick={onParentClick}>
      <DocsButton href="https://supabase.com/docs/guides/auth" />
    </div>
  )

  await user.click(screen.getByRole('link', { name: 'Docs' }))

  expect(onParentClick).not.toHaveBeenCalled()
})
