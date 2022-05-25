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
    <div className="border-scale-200 hover:border-brand-900 dark:bg-scale-400 m-4 w-full cursor-pointer rounded-md border px-4 shadow-sm hover:shadow-2xl lg:w-2/5">
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
