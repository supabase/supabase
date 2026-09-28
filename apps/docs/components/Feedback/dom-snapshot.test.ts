// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { getMeaningfulTarget, snapshotElement } from './dom-snapshot'
import { describeElement } from './element-descriptor.utils'

afterEach(() => {
  document.body.innerHTML = ''
})

const render = (html: string) => {
  document.body.innerHTML = html
}

const byId = (id: string): Element => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`#${id} not rendered`)
  return element
}

const query = (selector: string): Element => {
  const element = document.querySelector(selector)
  if (!element) throw new Error(`${selector} not rendered`)
  return element
}

describe('getMeaningfulTarget', () => {
  it('climbs from a Shiki token to its code block', () => {
    render(`<main><article><pre><code><span><span>npm</span></span></code></pre></article></main>`)
    expect(getMeaningfulTarget(query('span span')).tagName).toBe('PRE')
  })

  it('stops at the nearest link or button', () => {
    render(`<main><article><p><a href="/x"><strong>Docs</strong></a></p></article></main>`)
    expect(getMeaningfulTarget(query('strong')).tagName).toBe('A')
  })

  it('stops at a paragraph rather than a section with an id', () => {
    render(`<main><article><section id="auth"><p><em>word</em></p></section></article></main>`)
    expect(getMeaningfulTarget(query('em')).tagName).toBe('P')
  })

  it('never climbs past the article', () => {
    render(`<main><article id="page"><div><span>text</span></div></article></main>`)
    expect(getMeaningfulTarget(query('span')).tagName).toBe('SPAN')
  })
})

describe('snapshotElement', () => {
  it('finds the nearest preceding heading, skipping the "#" anchor', () => {
    render(`
      <main><article>
        <h2 id="setup">Setup<a href="#setup">#</a></h2>
        <div><h3 id="install">Install<a href="#install">#</a></h3></div>
        <p>Run this:</p>
        <div><pre id="code"><code>npm i</code></pre></div>
      </article></main>`)

    const snapshot = snapshotElement({ element: byId('code'), pathname: '/guides/auth' })

    expect(snapshot).toMatchObject({
      region: 'content',
      headingId: 'install',
      headingText: 'Install',
      text: 'npm i',
    })
  })

  it('does not look for headings outside the content container', () => {
    render(`
      <main>
        <h2 id="outside">Outside</h2>
        <article><p id="first">First</p></article>
      </main>`)

    expect(snapshotElement({ element: byId('first'), pathname: '/' }).headingId).toBeNull()
  })

  it('uses the nearest tagged region, and treats portaled articles as other', () => {
    render(`
      <main><nav data-feedback-region="nav"><a id="nav-link" href="/a">A</a></nav></main>
      <aside data-feedback-region="rail"><a id="rail-link" href="#b">B</a></aside>
      <header><button id="avatar">me@example.com</button></header>
      <div role="dialog"><article><p id="portaled">Portaled</p></article></div>`)

    expect(snapshotElement({ element: byId('nav-link'), pathname: '/' }).region).toBe('nav')
    expect(snapshotElement({ element: byId('rail-link'), pathname: '/' }).region).toBe('rail')
    expect(snapshotElement({ element: byId('avatar'), pathname: '/' }).region).toBe('other')
    expect(snapshotElement({ element: byId('portaled'), pathname: '/' }).region).toBe('other')
  })

  it('flags redacted subtrees', () => {
    render(
      `<main><article><div data-feedback-redact><button id="key">Copy key</button></div></article></main>`
    )
    expect(snapshotElement({ element: byId('key'), pathname: '/' }).isRedacted).toBe(true)
  })

  it('redacts a text block climbed to from a gap inside a redacted subtree', () => {
    render(
      `<main><article><li>Short<div data-feedback-redact><button>my-org</button><div></div></div></li></article></main>`
    )
    const target = getMeaningfulTarget(query('[data-feedback-redact] > div'))
    expect(target.tagName).toBe('LI')

    const pin = describeElement(snapshotElement({ element: target, pathname: '/' }))

    expect(pin.name).toBeNull()
    expect(pin.text).toBeNull()
  })

  it('reads labels without the text of controls inside them and never the value', () => {
    render(`
      <main><article>
        <span id="lbl">Project</span>
        <label>Branch <select id="branch" aria-labelledby="lbl"><option>acme-prod</option></select></label>
        <input id="key" value="secret-value" />
      </article></main>`)

    const select = snapshotElement({ element: byId('branch'), pathname: '/' })
    expect(select.labelledByText).toBe('Project')
    expect(select.labelText?.trim()).toBe('Branch')
    expect(select.text).toBe('')
    expect(JSON.stringify(snapshotElement({ element: byId('key'), pathname: '/' }))).not.toContain(
      'secret-value'
    )
  })
})
