import { describe, it, expect, vi } from 'vitest'
import { openInstallGitHubIntegrationWindow, getGitHubProfileImgUrl } from './github'

// mock window.open
vi.stubGlobal('open', vi.fn())

describe('openInstallGitHubIntegrationWindow', () => {
  it('should open the install window', () => {
    openInstallGitHubIntegrationWindow('install')

    expect(window.open).toHaveBeenCalled()
  })
})

describe('getGitHubProfileImgUrl', () => {
  it('should return the correct URL', () => {
    const result = getGitHubProfileImgUrl('test')

    expect(result).toBe('https://github.com/test.png?size=96')
  })
})
