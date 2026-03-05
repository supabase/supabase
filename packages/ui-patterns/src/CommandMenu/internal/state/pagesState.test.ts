import { beforeEach, describe, expect, it } from 'vitest'

import { initPagesState, PageType, type IPagesState, type PageDefinition } from './pagesState'

describe('pagesState', () => {
  let pagesState: IPagesState

  beforeEach(() => {
    pagesState = initPagesState()
  })

  it('Starts with an empty page stack', () => {
    expect(pagesState.pageStack.length).toBe(0)
  })

  it('Starts with no pages', () => {
    expect(Object.keys(pagesState.commandPages).length).toBe(0)
  })

  it('Registers a new page', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    pagesState.registerNewPage('page', newPage)

    expect(pagesState.commandPages.page).toStrictEqual(newPage)
  })

  it('Returned function unregisters the page', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    const unregister = pagesState.registerNewPage('page', newPage)
    expect(pagesState.commandPages.page).toStrictEqual(newPage)

    unregister()
    expect(Object.keys(pagesState.commandPages).length).toBe(0)
  })

  it('Registered page can be appended to page stack', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    pagesState.registerNewPage('page', newPage)
    pagesState.appendPageStack('page')

    expect(pagesState.pageStack.length).toBe(1)
    expect(pagesState.pageStack[0]).toBe('page')
  })

  it('Non-registered page cannot be appended to page stack', () => {
    pagesState.appendPageStack('invalid')

    expect(pagesState.pageStack.length).toBe(0)
  })

  it('Unregistered page cannot be appended to page stack', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    const unregister = pagesState.registerNewPage('page', newPage)
    unregister()

    pagesState.appendPageStack('page')

    expect(pagesState.pageStack.length).toBe(0)
  })

  it('Noops if reappending the currently active page', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    pagesState.registerNewPage('page', newPage)

    pagesState.appendPageStack('page')
    pagesState.appendPageStack('page')

    expect(pagesState.pageStack.length).toBe(1)
    expect(pagesState.pageStack[0]).toBe('page')
  })

  it('Unregistered page is automatically popped from stack', () => {
    const newPage: PageDefinition = {
      type: PageType.Commands,
      sections: [],
    }

    const unregister = pagesState.registerNewPage('page', newPage)
    pagesState.appendPageStack('page')
    expect(pagesState.pageStack.length).toBe(1)

    unregister()
    expect(pagesState.pageStack.length).toBe(0)
  })

  it('Does not error when popping from empty pagestack', () => {
    expect(() => pagesState.popPageStack()).not.toThrowError()
  })
})
