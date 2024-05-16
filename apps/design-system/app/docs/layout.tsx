import Navigation from './Navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[1200px] flex flex-row gap-32">
      <Navigation />

      <article>{children}</article>
    </main>
  )
}
