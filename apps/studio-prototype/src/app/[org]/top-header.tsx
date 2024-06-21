import { ChevronsUpDown, Slash } from 'lucide-react'
import { Button } from 'ui'

export default function TopHeader() {
  const buttonType = 'default'
  const showSlashes = false

  return (
    <div className="border-b h-[48px] w-full px-3">
      <div className="flex items-center h-full -space-x-px">
        <Button
          type={buttonType}
          className="rounded-tr-none rounded-br-none"
          iconRight={<ChevronsUpDown />}
        >
          Organization - Something
        </Button>
        {showSlashes && <Slash className="text-border-secondary" size={12} />}

        <Button type={buttonType} className="rounded-none" iconRight={<ChevronsUpDown />}>
          Project - Something
        </Button>
        {showSlashes && <Slash className="text-border-secondary" size={12} />}
        <Button
          type={buttonType}
          className="rounded-tl-none rounded-bl-none"
          iconRight={<ChevronsUpDown />}
        >
          Branch
        </Button>
      </div>
    </div>
  )
}
