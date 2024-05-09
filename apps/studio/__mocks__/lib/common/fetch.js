export const get = jest.fn()
export const post = jest.fn()
export const isResponseOk = jest.fn().mockImplementation((v) => Boolean(v))
