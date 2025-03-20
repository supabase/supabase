export default function Page({ searchParams }: { searchParams: { error: string } }) {
  return <div>Sorry, something went wrong. Code error: {searchParams.error}</div>
}
