export async function eachParallel<T>(times: number, fn: (index: number) => Promise<T>) {
  const promises = []
  for (let i = 0; i < times; i++) {
    promises.push(fn(i))
  }

  return Promise.all(promises)
}
