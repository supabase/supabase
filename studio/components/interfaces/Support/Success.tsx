import Link from 'next/link'
import { Button, IconCheckCircle } from 'ui'

const Success = () => {
  return (
    <div className="relative my-10 mx-32 space-y-4">
      <div className="absolute -left-14 -top-2.5">
        <IconCheckCircle strokeWidth={2} size={24} background="brand" />
      </div>
      <div>
        <h5 className="block">Support request successfully sent!</h5>
        <p className="text-sm text-scale-1100">
          We will email you back using your GitHub email address
        </p>
      </div>
      <Link href="/">
        <Button>Go back to dashboard</Button>
      </Link>
    </div>
  )
}

export default Success
