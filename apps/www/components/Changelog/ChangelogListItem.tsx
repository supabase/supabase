import dayjs from 'dayjs'
import Link from 'next/link'

type LinkProps = {
  variant: 'link'
  title: string
  /** ISO date string used for display */
  date: string
  href: string
}

type ActionProps = {
  variant: 'action'
  title: string
  date: string
  onSelect: () => void
}

type Props = LinkProps | ActionProps

const rowClass =
  'group flex h-full w-full flex-col border-b border-default py-2 sm:py-4 lg:grid lg:grid-cols-10 xl:grid-cols-12'

export function ChangelogListItem(props: Props) {
  const dateLabel = dayjs(props.date).format('D MMM YYYY')
  const titleRow = (
    <div className="flex w-full lg:col-span-8 xl:col-span-8">
      <h3 className="text-foreground text-lg group-hover:underline">{props.title}</h3>
    </div>
  )
  const metaRow = (
    <div className="flex items-center lg:col-span-2 xl:col-span-4">
      <p className="text-foreground-lighter group-hover:text-foreground-light w-full flex-1 text-right text-sm">
        {dateLabel}
      </p>
    </div>
  )

  if (props.variant === 'link') {
    return (
      <Link href={props.href} prefetch={false} className={rowClass}>
        {titleRow}
        {metaRow}
      </Link>
    )
  }

  return (
    <button type="button" onClick={props.onSelect} className={`${rowClass} cursor-pointer bg-transparent text-left`}>
      {titleRow}
      {metaRow}
    </button>
  )
}
