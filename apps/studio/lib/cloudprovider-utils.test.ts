import { describe, it, expect } from 'vitest'
import { getCloudProviderArchitecture } from './cloudprovider-utils'
import { PROVIDERS } from './constants'
describe('getCloudProviderArchitecture', () => {
  it('should return the correct architecture', () => {
    const result = getCloudProviderArchitecture(PROVIDERS.AWS.id)

    expect(result).toBe('ARM')
  })

  it('should return the correct architecture for fly', () => {
    const result = getCloudProviderArchitecture(PROVIDERS.FLY.id)

    expect(result).toBe('x86 64-bit')
  })

  it('should return an empty string if the cloud provider is not supported', () => {
    const result = getCloudProviderArchitecture('unknown')

    expect(result).toBe('')
  })
})
