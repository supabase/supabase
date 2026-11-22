import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { NoProjectsNotice } from './NoProjectsNotice'
import { customRender } from '@/tests/lib/custom-render'

describe('NoProjectsNotice', () => {
  test('interpolates the organization into the title', () => {
    customRender(<NoProjectsNotice appName="Vercel" organizationName="contoso-labs" />)

    expect(screen.getByText('No projects in contoso-labs')).toBeInTheDocument()
  })

  test('interpolates the app name into the body', () => {
    customRender(<NoProjectsNotice appName="Vercel" organizationName="contoso-labs" />)

    expect(
      screen.getByText(
        "Vercel needs access to at least one project, and this organization doesn't have any yet."
      )
    ).toBeInTheDocument()
  })

  test('interpolates a different app name, so the copy is not hardcoded', () => {
    customRender(<NoProjectsNotice appName="Fabrikam" organizationName="contoso-labs" />)

    expect(
      screen.getByText(
        "Fabrikam needs access to at least one project, and this organization doesn't have any yet."
      )
    ).toBeInTheDocument()
  })

  test('shows the same organization slug it was given', () => {
    customRender(<NoProjectsNotice appName="Vercel" organizationName="northwind-traders" />)

    expect(screen.getByText('No projects in northwind-traders')).toBeInTheDocument()
    expect(screen.queryByText('No projects in contoso-labs')).not.toBeInTheDocument()
  })
})
