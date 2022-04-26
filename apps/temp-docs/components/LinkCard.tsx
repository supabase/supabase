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
    <div className="shadow-sm dark:bg-gray-900 border border-black px-4 rounded-md hover:border-brand-600 hover:border-2 hover:shadow-2xl cursor-pointer m-4 w-full lg:w-2/5">
      {description ? (
        <>
          <h4 className="p-0 my-0">{title}</h4>
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
