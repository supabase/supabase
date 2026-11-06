// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { HeadingLinksIsland } from './HeadingLinksIsland'

describe('HeadingLinksIsland', () => {
  let root: Root | undefined

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('adds one copy link button to each article h2 to h4 that has an id', () => {
    // the prose article holds the guide body, and the related guide cards are articles too
    document.body.innerHTML = `
      <article class="prose">
        <h1>Title</h1>
        <h2 id="setup">Setup</h2>
        <h3 id="install">Install</h3>
        <h4 id="verify">Verify</h4>
        <h5 id="details">Details</h5>
        <h2>No id</h2>
        <div role="alert"><h3 id="note">Note</h3></div>
      </article>
      <article><h3 id="related">Related guide</h3></article>
      <div id="island"></div>
    `
    root = createRoot(document.getElementById('island')!)
    act(() => root?.render(<HeadingLinksIsland />))

    const headingIds = [
      ...document.querySelectorAll('button[aria-label="Copy link to section"]'),
    ].map((button) => button.parentElement?.id)
    expect(headingIds).toEqual(['setup', 'install', 'verify'])
  })
})
