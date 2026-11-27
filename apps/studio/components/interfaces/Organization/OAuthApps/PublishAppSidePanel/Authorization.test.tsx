import { zodResolver } from '@hookform/resolvers/zod'
import { fireEvent, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test } from 'vitest'

import { MEMBER_BOUND_GRANT_NOTICE } from '../Consent/AuthorizingAsCard'
import { AuthorizationSection } from './Authorization'
import { AuthorizationValues, DEFAULT_AUTHORIZATION_VALUES } from './Authorization.utils'
import {
  formSchemaWithOAuthAppScopedGrants,
  FormSchemaWithOAuthAppScopedGrants,
} from './PublishAppSidePanel.utils'
import { customRender } from '@/tests/lib/custom-render'

const OWNER_OPTION = /An owner, once for the whole organization/
const MEMBER_OPTION = /Each member, for themselves/
const ALL_PROJECTS_OPTION = /^All projects(?! in)/
const LET_THEM_CHOOSE_OPTION = /Let them choose/

const TestForm = ({ savedValues }: { savedValues?: AuthorizationValues }) => {
  const form = useForm<FormSchemaWithOAuthAppScopedGrants>({
    defaultValues: {
      name: 'Acme Deploy',
      website: 'https://acme.test',
      redirect_uris: [{ id: 'one', value: 'https://acme.test/callback' }],
      ...(savedValues ?? DEFAULT_AUTHORIZATION_VALUES),
    },
    resolver: zodResolver(formSchemaWithOAuthAppScopedGrants),
  })

  return (
    <Form {...form}>
      <AuthorizationSection
        control={form.control}
        savedValues={savedValues}
        organizationName="Acme"
      />
    </Form>
  )
}

describe('AuthorizationSection', () => {
  test('a new app locks nothing and marks the stricter options as permanent', async () => {
    customRender(<TestForm />)

    expect(await screen.findByRole('radio', { name: OWNER_OPTION })).toBeEnabled()
    expect(await screen.findByRole('radio', { name: ALL_PROJECTS_OPTION })).toBeEnabled()
    expect(screen.queryByText('Current')).toBeNull()
    expect(screen.getAllByText('Permanent')).toHaveLength(2)
  })

  test('an app on the default setup marks owner and all projects as current, with nothing locked', async () => {
    customRender(<TestForm savedValues={DEFAULT_AUTHORIZATION_VALUES} />)

    expect(await screen.findByRole('radio', { name: OWNER_OPTION })).toBeEnabled()
    expect(await screen.findByRole('radio', { name: ALL_PROJECTS_OPTION })).toBeEnabled()
    expect(screen.getAllByText('Current')).toHaveLength(2)
    expect(screen.queryByText("Can't switch back")).toBeNull()
  })

  test('a saved stricter value disables the looser option', async () => {
    customRender(<TestForm savedValues={{ member_bound_grant: true, project_scoping: true }} />)

    expect(await screen.findByRole('radio', { name: OWNER_OPTION })).toBeDisabled()
    expect(await screen.findByRole('radio', { name: ALL_PROJECTS_OPTION })).toBeDisabled()
    expect(screen.getAllByText("Can't switch back")).toHaveLength(2)
    expect(screen.getAllByText('Current')).toHaveLength(2)
  })

  test('the preview describes the resulting grant and what it is today', async () => {
    customRender(<TestForm savedValues={DEFAULT_AUTHORIZATION_VALUES} />)

    expect(
      await screen.findByText('One grant for the organization, every project in it')
    ).toBeVisible()
    expect(screen.queryByText(/^Today:/)).toBeNull()

    fireEvent.click(await screen.findByRole('radio', { name: LET_THEM_CHOOSE_OPTION }))

    expect(
      await screen.findByText('One grant for the organization, projects chosen when connecting')
    ).toBeVisible()
    expect(
      await screen.findByText(/Today: One grant for the organization, every project in it/)
    ).toBeVisible()
  })

  test('the preview only explains the grant acts as you for member-bound grants', async () => {
    customRender(<TestForm savedValues={DEFAULT_AUTHORIZATION_VALUES} />)

    await screen.findByText('Authorize Acme Deploy')
    expect(screen.queryByText(MEMBER_BOUND_GRANT_NOTICE)).toBeNull()

    fireEvent.click(await screen.findByRole('radio', { name: MEMBER_OPTION }))

    expect(await screen.findByText(MEMBER_BOUND_GRANT_NOTICE)).toBeInTheDocument()
  })
})
