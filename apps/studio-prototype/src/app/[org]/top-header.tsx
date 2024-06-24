import { ChevronsUpDown, Slash } from 'lucide-react'
import { Button } from 'ui'
import { BranchMenu } from './branch-menu'

export default function TopHeader() {
  const buttonType = 'default'
  const showSlashes = false

  return (
    <div className="border-b h-[48px] w-full px-3 bg-dash-sidebar">
      <div className="flex items-center h-full -space-x-px">
        <BranchMenu />{' '}
        {/* <Button
          type={buttonType}
          className="rounded-tr-none rounded-br-none"
          iconRight={<ChevronsUpDown />}
        >
          <span className="text-foreground-lighter">Organization</span> Something
        </Button>
        {showSlashes && <Slash className="text-border-secondary" size={12} />}
        <Button type={buttonType} className="rounded-none" iconRight={<ChevronsUpDown />}>
          <span className="text-foreground-lighter">Project</span> Something
        </Button>
        {showSlashes && <Slash className="text-border-secondary" size={12} />}
        <Button
          type={buttonType}
          className="rounded-tl-none rounded-bl-none"
          iconRight={<ChevronsUpDown />}
        >
          <span className="text-foreground-lighter">Branch</span> Production
        </Button> */}
      </div>
    </div>
  )
}
