type MergedYield<Gens extends Record<string, AsyncGenerator<unknown>>> = {
  [K in keyof Gens]: Gens[K] extends AsyncGenerator<infer V> ? { type: K; value: V } : never
}[keyof Gens]

export async function* mergeAsyncGenerators<Gens extends Record<string, AsyncGenerator<unknown>>>(
  gens: Gens
): AsyncGenerator<MergedYield<Gens>> {
  // Convert the input object into an array of [name, generator] tuples
  const entries = Object.entries(gens) as [keyof Gens, Gens[keyof Gens]][]

  // Initialize an array to keep track of each generator's state
  const iterators = entries.map(([name, gen]) => ({
    name,
    iterator: gen[Symbol.asyncIterator](),
    done: false,
  }))

  // Continue looping as long as at least one generator is not done
  while (iterators.some((it) => !it.done)) {
    // Prepare an array of promises to fetch the next value from each generator
    const nextPromises = iterators.map((it) =>
      it.done ? Promise.resolve({ done: true, value: undefined }) : it.iterator.next()
    )

    // Await all the next() promises concurrently
    const results = await Promise.all(nextPromises)

    // Iterate through the results and yield values with their corresponding names
    for (let i = 0; i < iterators.length; i++) {
      const it = iterators[i]
      const result = results[i]

      if (!it.done && !result.done) {
        // Yield an object containing the generator's name and the yielded value
        yield { type: it.name, value: result.value } as MergedYield<Gens>
      }

      if (!it.done && result.done) {
        // Mark the generator as done if it has no more values
        it.done = true
      }
    }
  }
}
