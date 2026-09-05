import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { NoProjectsNotice } from './NoProjectsNotice'
import { customRender } from '@/tests/lib/custom-render'

describe('NoProjectsNotice', () => {
  test('interpolates the organization into the title', () => {
    customRender(
      <NoProjectsNotice appName="Vercel" organizationSlug="some-other-org" onSwitchOrg={vi.fn()} />
    )

    expect(screen.getByText('No projects in some-other-org')).toBeInTheDocument()
  })

  test('interpolates the app name into the body', () => {
    customRender(
      <NoProjectsNotice appName="Vercel" organizationSlug="some-other-org" onSwitchOrg={vi.fn()} />
    )

    expect(
      screen.getByText(
        "Vercel needs access to at least one project, and this organization doesn't have any yet."
      )
    ).toBeInTheDocument()
  })

  test('fires onSwitchOrg when the inline link is clicked', () => {
    const onSwitchOrg = vi.fn()
    customRender(
      <NoProjectsNotice
        appName="Vercel"
        organizationSlug="some-other-org"
        onSwitchOrg={onSwitchOrg}
      />
    )

    fireEvent.click(screen.getByText('Switch organization'))

    expect(onSwitchOrg).toHaveBeenCalledTimes(1)
  })
})
