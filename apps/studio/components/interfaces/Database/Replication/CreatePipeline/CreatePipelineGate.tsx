import { type ReactNode } from 'react'

export const CreatePipelineGate = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => {
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-xl text-foreground">{title}</h1>
        <p className="max-w-xl text-sm text-foreground-light">{description}</p>
      </header>
      {children}
    </div>
  )
}
