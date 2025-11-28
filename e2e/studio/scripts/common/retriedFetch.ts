import timeoutFetch from './timeoutFetch'

export default async function retriedFetch(
  input: RequestInfo,
  init?: RequestInit,
  timeout: number = 10000,
  retries: number = 3,
  delayBase: number = 200
): Promise<Response> {
  for (let i = 0; i < retries - 1; i++) {
    try {
      const res = await timeoutFetch(input, init, timeout)
      if (res.status >= 100 && res.status < 400) {
        return res
      }
      console.log(`Retrying fetch ${i} ${input}`, res.status, res.statusText)
    } catch (e) {
      console.log(`Retrying fetch ${i} ${input}`, e)
    } finally {
      await new Promise((resolve) => setTimeout(resolve, delayBase * (i + 1)))
    }
  }
  return await timeoutFetch(input, init, timeout)
}

export const muchMoreRetriedFetch = (retries = 5, delayBase = 500, timeout = 10000) => {
  return (input: RequestInfo, init?: RequestInit) => {
    return retriedFetch(input, init, timeout, retries, delayBase)
  }
}

export const longerRetriedFetch = (longerTimeout = 30000) => {
  return (input: RequestInfo, init?: RequestInit) => {
    return retriedFetch(input, init, longerTimeout)
  }
}
