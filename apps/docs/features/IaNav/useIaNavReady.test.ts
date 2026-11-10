// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { useIaNavReady } from './useIaNavReady'

const ReadyState = () => String(useIaNavReady())

describe('useIaNavReady', () => {
  it('is not ready in the server html', () => {
    expect(renderToString(createElement(ReadyState))).toBe('false')
  })

  it('is ready on the client, whatever the url and the cache hold', () => {
    const { result } = renderHook(() => useIaNavReady())

    expect(result.current).toBe(true)
  })
})
