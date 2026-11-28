// Embeds text with gte-small, the model built into the Edge Runtime, so there
// is no third-party API key. Vectors are 384-dimensional and normalized, so
// cosine similarity in Postgres ranks them.

const session = new Supabase.ai.Session('gte-small')

export async function embed(text: string): Promise<number[]> {
  const input = text.replace(/\s+/g, ' ').trim().slice(0, 2000)
  const output = await session.run(input, { mean_pool: true, normalize: true })
  return output as number[]
}
