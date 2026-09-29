import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'

import { AuthorizationSection } from './Authorization'
import { AuthorizationToggleState } from './Authorization.utils'
import { customRender } from '@/tests/lib/custom-render'

const OFF: AuthorizationToggleState = { checked: false, locked: false, confirmed: false }
const LOCKED_ON: AuthorizationToggleState = { checked: true, locked: true, confirmed: false }

const StatefulAuthorizationSection = ({
  initialMemberBoundGrant = OFF,
  initialProjectScoping = OFF,
}: {
  initialMemberBoundGrant?: AuthorizationToggleState
  initialProjectScoping?: AuthorizationToggleState
}) => {
  const [memberBoundGrantChecked, setMemberBoundGrantChecked] = useState(
    initialMemberBoundGrant.checked
  )
  const [memberBoundGrantConfirmed, setMemberBoundGrantConfirmed] = useState(
    initialMemberBoundGrant.confirmed
  )
  const [projectScopingChecked, setProjectScopingChecked] = useState(initialProjectScoping.checked)
  const [projectScopingConfirmed, setProjectScopingConfirmed] = useState(
    initialProjectScoping.confirmed
  )

  return (
    <AuthorizationSection
      memberBoundGrant={{
        checked: memberBoundGrantChecked,
        locked: initialMemberBoundGrant.locked,
        confirmed: memberBoundGrantConfirmed,
      }}
      onMemberBoundGrantChange={setMemberBoundGrantChecked}
      onMemberBoundGrantConfirmedChange={setMemberBoundGrantConfirmed}
      projectScoping={{
        checked: projectScopingChecked,
        locked: initialProjectScoping.locked,
        confirmed: projectScopingConfirmed,
      }}
      onProjectScopingChange={setProjectScopingChecked}
      onProjectScopingConfirmedChange={setProjectScopingConfirmed}
    />
  )
}

describe('AuthorizationSection', () => {
  test('shows the legacy resulting grant when both toggles are off', () => {
    customRender(<StatefulAuthorizationSection />)

    expect(screen.getByText('Legacy behaviour, unchanged from today.')).toBeInTheDocument()
    expect(screen.queryByText("This can't be turned off after you save")).not.toBeInTheDocument()
  })

  test('turning a toggle on shows the permanence warning and checkbox', async () => {
    const user = userEvent.setup()
    customRender(<StatefulAuthorizationSection />)

    await user.click(
      screen.getByRole('switch', { name: 'Use the permissions of the person who connects' })
    )

    expect(screen.getByText("This can't be turned off after you save")).toBeInTheDocument()
    expect(
      screen.getByText('I understand this is permanent. I can test it on a duplicate app first')
    ).toBeInTheDocument()
    expect(screen.getByText('One grant per member, organization-wide.')).toBeInTheDocument()
  })

  test('turning a toggle off clears its confirmation checkbox and warning', async () => {
    const user = userEvent.setup()
    customRender(<StatefulAuthorizationSection />)

    const toggle = screen.getByRole('switch', {
      name: 'Use the permissions of the person who connects',
    })
    await user.click(toggle)
    await user.click(screen.getByRole('checkbox'))
    await user.click(toggle)

    expect(screen.queryByText("This can't be turned off after you save")).not.toBeInTheDocument()
  })

  test('a toggle locked from load renders on and disabled with no callout', () => {
    customRender(<StatefulAuthorizationSection initialMemberBoundGrant={LOCKED_ON} />)

    const toggle = screen.getByRole('switch', {
      name: 'Use the permissions of the person who connects',
    })
    expect(toggle).toBeChecked()
    expect(toggle).toBeDisabled()
    expect(screen.queryByText("This can't be turned off after you save")).not.toBeInTheDocument()
  })

  test('shows the combined explanation and resulting grant when both toggles are on', async () => {
    const user = userEvent.setup()
    customRender(<StatefulAuthorizationSection />)

    await user.click(
      screen.getByRole('switch', { name: 'Use the permissions of the person who connects' })
    )
    await user.click(screen.getByRole('switch', { name: 'Ask for specific projects' }))

    expect(
      screen.getByText('One grant per member, limited to chosen projects.')
    ).toBeInTheDocument()
  })
})
