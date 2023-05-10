import { NextPage } from 'next'
import { AppProps } from 'next/app'
import { ComponentType, ReactElement, ReactNode } from 'react'

export type AppPropsWithLayout = AppProps<{ dehydratedState: any }> & {
  Component: NextPageWithLayout
}

export type NextPageWithLayout<P = { dehydratedState: any }, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

export function isNextPageWithLayout<T>(
  Component: ComponentType<T> | NextPageWithLayout<T, T>
): Component is NextPageWithLayout<T, T> {
  return 'getLayout' in Component && typeof Component.getLayout === 'function'
}
