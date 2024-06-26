'use client'

export default function ProjectContentTransition({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <div className="grow">{children}</div>
    </>
  )
}
