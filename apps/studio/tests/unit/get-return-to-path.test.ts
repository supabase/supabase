import { getReturnToPath } from 'lib/gotrue'

describe(`getReturnToPath`, () => {
  it(`returns to /projects when no fallback is provided`, () => {
    expect(getReturnToPath()).toBe('/projects')
  })

  it(`returns to /custom when fallback is provided`, () => {
    expect(getReturnToPath('/custom')).toBe('/custom')
  })

  it(`returns to /custom`, () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: `?returnTo=/custom` }

    expect(getReturnToPath()).toBe('/custom')
  })

  it(`returns to /custom?foo=bar`, () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: `?returnTo=/custom?foo=bar` }

    expect(getReturnToPath()).toBe('/custom?foo=bar')
  })

  it(`does not return to https://google.com`, () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: `?returnTo=https://google.com` }

    expect(getReturnToPath()).toBe('/projects')
  })

  it(`does not allow XSS`, () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: `?returnTo=javascript:alert(1)` }

    expect(getReturnToPath()).toBe('/projects')
  })

  it(`does not allow XSS with encoded characters`, () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: `?returnTo=javascript%3Aalert%281%29` }

    expect(getReturnToPath()).toBe('/projects')
  })
})
