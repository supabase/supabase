import Link from 'next/link'

export default function LinkCard({
  title,
  description,
  icon,
  link,
}: {
  title: string
  description: string
  icon: any
  link: string
}) {
  return (
    <Link
      href={link || '#'}
      className="border-background hover:border-brand bg-surface-200 m-4 w-full cursor-pointer rounded-md border p-4 shadow-sm hover:shadow-2xl lg:w-2/5"
    >
      {description ? (
        <>
          <h4 className="m-0 mb-4 p-0 text-base font-semibold">{title}</h4>
          <p className="text-foreground-light m-0 p-0">{description}</p>
        </>
      ) : (
        <div className="flex">
          {icon}
          <p className="text-foreground m-0 p-0">{title}</p>
        </div>
      )}
    </Link>
  )
}
