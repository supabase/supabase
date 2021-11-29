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
    <div className="shadow-sm border border-black px-4 rounded-md hover:border-green-400 hover:border-2 hover:shadow-xl cursor-pointer">
      {!icon && (
        <>
          <h4 className="p-0 my-0">{title}</h4>
          <p>{description}</p>
        </>
      )}
      {icon && (
        <div className="flex">
          {icon}
          <p>{title}</p>
        </div>
      )}
    </div>
  )
}
