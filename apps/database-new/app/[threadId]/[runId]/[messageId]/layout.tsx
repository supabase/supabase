export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main role="main" className="h-[calc(100vh-115px)] w-full flex flex-col grow">
      {children}
    </main>
  )
}
