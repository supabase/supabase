import { beforeEach, describe, expect, it } from 'vitest'

import { initViewState } from './viewState'
import { type IViewState } from './viewState.types'

describe('viewState', () => {
  let viewState: IViewState

  beforeEach(() => {
    viewState = initViewState()
  })

  it('does not initiate when closing a menu that was never opened', () => {
    viewState.setOpen(false)

    expect(viewState.initiated).toBe(false)
    expect(viewState.open).toBe(false)
  })

  it('initiates and opens when set open', () => {
    viewState.setOpen(true)

    expect(viewState.initiated).toBe(true)
    expect(viewState.open).toBe(true)
  })

  it('stays initiated after closing an opened menu', () => {
    viewState.setOpen(true)
    viewState.setOpen(false)

    expect(viewState.initiated).toBe(true)
    expect(viewState.open).toBe(false)
  })

  it('initiates when toggled open from closed', () => {
    viewState.toggleOpen()

    expect(viewState.initiated).toBe(true)
    expect(viewState.open).toBe(true)
  })
})
