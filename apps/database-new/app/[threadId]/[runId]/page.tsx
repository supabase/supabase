export default function ThreadPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="grow max-h-screen flex flex-row items-center justify-between bg-alternative h-full">
      {children}
    </div>
  )
}
