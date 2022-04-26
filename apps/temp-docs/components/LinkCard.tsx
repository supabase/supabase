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
    <div className="hover:border-brand-600 m-4 w-full cursor-pointer rounded-md border border-black px-4 shadow-sm hover:border-2 hover:shadow-2xl dark:bg-gray-900 lg:w-2/5">
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
