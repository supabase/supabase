import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, IconCalendar } from 'ui'
import { FormPanel } from 'components/ui/Forms'

const PITRNotice = ({}) => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <FormPanel
      disabled={true}
      footer={
        <div className="flex items-center justify-between p-6">
          <span className="text-scale-1000 text-sm">
            Recovery retention period can be increased - reach out to us!
          </span>
          <Link href={`/support/new?ref=${ref}&category=sales`}>
            <a>
              <Button as="span" type="default">
                Contact support
              </Button>
            </a>
          </Link>
        </div>
      }
    >
      <div className="p-6 flex space-x-6">
        <div className="h-10 w-10 rounded flex items-center justify-center bg-scale-700">
          <IconCalendar strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <p className="text-sm">Recovery retention period</p>
          <p className="text-sm text-scale-1100">
            Database changes are logged every <span className="text-scale-1200">2 minutes</span>,
            with a total recovery period of up to <span className="text-scale-1200">7 days</span>.
          </p>
        </div>
      </div>
    </FormPanel>
  )
}

export default PITRNotice
