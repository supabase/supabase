import { urlRegex } from 'components/interfaces/Auth/Auth.constants'

describe('Auth.constants: domainRegex', () => {
  test('should validate typical URLs', () => {
    const mockInput1 = 'http://domain.com'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)

    const mockInput2 = 'https://supabase.io'
    const output2 = urlRegex.test(mockInput2)
    expect(output2).toBe(true)

    const mockInput3 = 'https://new-domain-vercel.com'
    const output3 = urlRegex.test(mockInput3)
    expect(output3).toBe(true)

    const mockInput4 = 'www.test-domain.com'
    const output4 = urlRegex.test(mockInput4)
    expect(output4).toBe(true)
  })
  test('should validate app-based domains', () => {
    const mockInput1 = 'exp://exp.host/some-app'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)

    const mockInput2 = 'exp://exp.host/some-app?release-channel=default'
    const output2 = urlRegex.test(mockInput2)
    expect(output2).toBe(true)
  })
  test('should validate subdomains', () => {
    const mockInput1 = 'https://supabase.com/dashboard'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)
  })
  test('should validate localhost URLs', () => {
    const mockInput1 = 'http://localhost:3000'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)
  })
  test('should validate URLs with query params', () => {
    const mockInput1 = 'https://supabase.com?name=test'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)

    const mockInput2 = 'https://supabase.com?name=test&description=hello&page=2'
    const output2 = urlRegex.test(mockInput2)
    expect(output2).toBe(true)
  })
  test('should validate URLs with wildcards', () => {
    const mockInput1 = 'https://supabase*.com'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(true)

    const mockInput2 = 'https://supabase.com/*'
    const output2 = urlRegex.test(mockInput2)
    expect(output2).toBe(true)

    const mockInput3 = 'https://new-*-domain.com/*'
    const output3 = urlRegex.test(mockInput3)
    expect(output3).toBe(true)

    const mockInput4 = 'https://new-*-domain.com/*/*/*'
    const output4 = urlRegex.test(mockInput4)
    expect(output4).toBe(true)

    const mockInput5 = 'https://sub-*-domain.new-*-domain.com/*/*/*'
    const output5 = urlRegex.test(mockInput5)
    expect(output5).toBe(true)
  })
  test('should invalidate invalid URLs', () => {
    const mockInput1 = 'supabase'
    const output1 = urlRegex.test(mockInput1)
    expect(output1).toBe(false)

    const mockInput2 = 'mailto:test@gmail.com'
    const output2 = urlRegex.test(mockInput2)
    expect(output2).toBe(false)

    const mockInput4 = 'hello world.com'
    const output4 = urlRegex.test(mockInput4)
    expect(output4).toBe(false)

    const mockInput5 = 'email@domain.com'
    const output5 = urlRegex.test(mockInput5)
    expect(output5).toBe(false)
  })
})
