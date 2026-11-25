import { createRootRoute, createRoute, useLocation } from '@tanstack/react-router'
import { act, screen } from '@testing-library/react'
import { useParams } from 'common'
import { expect, it } from 'vitest'

import { renderRoute } from './route-render'

function Probe() {
  const params = useParams()
  const location = useLocation()
  return (
    <>
      <output aria-label="params">{JSON.stringify(params)}</output>
      <output aria-label="search">{JSON.stringify(location.search)}</output>
      <output aria-label="href">{location.href}</output>
    </>
  )
}

const ProbeRoute = createRoute({
  getParentRoute: () => createRootRoute(),
  path: 'probe',
  component: Probe,
})

const readOutput = (name: string) => JSON.parse(screen.getByLabelText(name).textContent ?? '')

it('exposes path and search params from the route URL to router hooks', async () => {
  const { router } = await renderRoute(ProbeRoute, {
    routeId: '/project/$ref/probe',
    url: '/project/abc/probe?query-tab=logs&id=1&id=2',
  })

  expect(readOutput('params')).toEqual({ ref: 'abc', queryTab: 'logs', id: '1' })
  expect(readOutput('search')).toEqual({ 'query-tab': 'logs', id: ['1', '2'] })
  expect(screen.getByLabelText('href')).toHaveTextContent(
    '/project/abc/probe?query-tab=logs&id=1&id=2'
  )

  await act(() => router.navigate({ href: '/project/xyz/probe?query-tab=sql' }))

  expect(readOutput('params')).toEqual({ ref: 'xyz', queryTab: 'sql' })
  expect(readOutput('search')).toEqual({ 'query-tab': 'sql' })
  expect(screen.getByLabelText('href')).toHaveTextContent('/project/xyz/probe?query-tab=sql')
})
