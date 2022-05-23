import { ReactElement } from 'react'

export default function LinkCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactElement
}) {
  return (
    <div className="m-4 w-full cursor-pointer rounded-md border border-scale-200 hover:border-brand-900 px-4 shadow-sm hover:shadow-2xl dark:bg-scale-400 lg:w-2/5">
      {description ? (
        <>
          <h4 className="my-0 p-0">{title}</h4>
          <p>{description}</p>
        </>
      ) : (
        <div className="flex">
          {icon}
          <p>{title}</p>
        </div>
      )}
    </div>
  )
}
