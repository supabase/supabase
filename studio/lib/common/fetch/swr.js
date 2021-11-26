export default async function Fetch(...args) {
  const res = await fetch(...args)
  const body = await res.json()
  return body
}
