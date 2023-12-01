export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" className="px-4 xl:px-0 xl:max-w-4xl mx-auto h-full bg-orange-300">
      {children}
    </main>
  )
}
