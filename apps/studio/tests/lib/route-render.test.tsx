import { createRootRoute, createRoute } from '@tanstack/react-router'
import { act, screen } from '@testing-library/react'
import { useParams } from 'common'
import { useRouter as useCompatRouter } from 'next/compat/router'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { expect, it } from 'vitest'

import { renderRoute } from './route-render'

function Probe() {
  const params = useParams()
  const router = useRouter()
  const compatRouter = useCompatRouter()
  const pathname = usePathname()
  return (
    <>
      <output aria-label="params">{JSON.stringify(params)}</output>
      <output aria-label="router">{JSON.stringify(router.query)}</output>
      <output aria-label="compat router">{JSON.stringify(compatRouter?.query)}</output>
      <output aria-label="as path">{router.asPath}</output>
      <output aria-label="pathname">{pathname}</output>
    </>
  )
}

const ProbeRoute = createRoute({
  getParentRoute: () => createRootRoute(),
  path: 'probe',
  component: Probe,
})

const readOutput = (name: string) => JSON.parse(screen.getByLabelText(name).textContent ?? '')

it('exposes path and search params from the route URL to Next-style router hooks', async () => {
  const { router } = await renderRoute(ProbeRoute, {
    routeId: '/project/$ref/probe',
    url: '/project/abc/probe?query-tab=logs&id=1&id=2',
  })

  expect(readOutput('params')).toEqual({ ref: 'abc', queryTab: 'logs', id: '1' })
  const query = { ref: 'abc', 'query-tab': 'logs', id: ['1', '2'] }
  expect(readOutput('router')).toEqual(query)
  expect(readOutput('compat router')).toEqual(query)
  expect(screen.getByLabelText('as path')).toHaveTextContent(
    '/project/abc/probe?query-tab=logs&id=1&id=2'
  )

  await act(() => router.navigate({ href: '/project/xyz/probe?query-tab=sql' }))

  expect(readOutput('params')).toEqual({ ref: 'xyz', queryTab: 'sql' })
  const nextQuery = { ref: 'xyz', 'query-tab': 'sql' }
  expect(readOutput('router')).toEqual(nextQuery)
  expect(readOutput('compat router')).toEqual(nextQuery)
  expect(screen.getByLabelText('as path')).toHaveTextContent('/project/xyz/probe?query-tab=sql')
  expect(screen.getByLabelText('pathname')).toHaveTextContent('/project/xyz/probe')
})
