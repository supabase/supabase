import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, getByText, render as originalRender, screen } from '@testing-library/react'
import type React from 'react'
import { useState } from 'react'

// End of third-party imports

import { ProjectInfoInfinite } from 'data/projects/projects-infinite-query'
import type { Organization } from 'types'
import { TooltipProvider } from 'ui'

interface SelectorOptions {
  container?: HTMLElement
}

/**
 * Returns the toggle button given a text matcher
 *
 * Defaults to screen if container option is not provided
 */
export const getToggleByText = (
  text: string | RegExp,
  options: SelectorOptions = {}
): HTMLElement | null => {
  const container = options?.container
  let textNode
  if (container) {
    textNode = getByText(container as HTMLElement, text)
  } else {
    textNode = screen.getByText(text)
  }
  if (textNode && textNode.parentElement) {
    return textNode.parentElement.querySelector('button')
  } else {
    return textNode
  }
}

export const clickDropdown = (elem: HTMLElement) => {
  fireEvent.pointerDown(
    elem,
    new window.PointerEvent('pointerdown', {
      ctrlKey: false,
      button: 0,
    })
  )
}

export const createMockOrganization = (details: Partial<Organization>): Organization => {
  const base: Organization = {
    id: 1,
    name: 'Organization 1',
    slug: 'abcdefghijklmnopqrst',
    plan: { id: 'free', name: 'Free' },
    managed_by: 'supabase',
    is_owner: true,
    billing_email: 'billing@example.com',
    billing_partner: null,
    usage_billing_enabled: false,
    stripe_customer_id: 'stripe-1',
    subscription_id: 'subscription-1',
    organization_requires_mfa: false,
    opt_in_tags: [],
    restriction_status: null,
    restriction_data: null,
    organization_missing_address: false,
  }

  return Object.assign(base, details)
}

export const createMockProject = (details: Partial<ProjectInfoInfinite>): ProjectInfoInfinite => {
  const base: ProjectInfoInfinite = {
    id: 1,
    ref: 'abcdefghijklmnopqrst',
    name: 'Project 1',
    status: 'ACTIVE_HEALTHY',
    organization_id: 1,
    cloud_provider: 'AWS',
    region: 'us-east-1',
    inserted_at: new Date().toISOString(),
    subscription_id: 'subscription-1',
    is_branch_enabled: false,
    is_physical_backups_enabled: false,
    organization_slug: 'slug',
    preview_branch_refs: [],
  }

  return Object.assign(base, details)
}

/**
 * A custom render function for react testing library
 * https://testing-library.com/docs/react-testing-library/setup/#custom-render
 */
const ReactQueryTestConfig: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      })
  )

  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TooltipProvider>
  )
}
type renderParams = Parameters<typeof originalRender>
export const render = ((ui: renderParams[0], options: renderParams[1]) =>
  originalRender(ui, {
    wrapper: ReactQueryTestConfig,
    ...options,
  })) as typeof originalRender
