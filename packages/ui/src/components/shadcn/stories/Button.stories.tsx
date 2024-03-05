import { Meta } from '@storybook/react'
import { ChevronRight, Loader2, Mail } from 'lucide-react'
import { Button } from '../ui/button'
// import Link from 'next/link'

const meta: Meta<typeof Button> = {
  title: 'shadcn/Button',
  component: Button,
}

export const Default = () => <Button>Button</Button>

Default.storyName = 'Default'

export const Secondary = () => <Button variant="secondary">Secondary</Button>

Secondary.storyName = 'Secondary'

export const Destructive = () => <Button variant="destructive">Destructive</Button>

Destructive.storyName = 'Destructive'

export const Outline = () => <Button variant="outline">Outline</Button>

Outline.storyName = 'Outline'

export const Ghost = () => <Button variant="ghost">Ghost</Button>

Ghost.storyName = 'Ghost'

// export const LinkButton = () => (
//   <Link href="/">
//     <Button variant="link">Link</Button>
//   </Link>
// )

// LinkButton.storyName = 'Link'

export const Icon = () => (
  <Button>
    <ChevronRight />
  </Button>
)

Icon.storyName = 'Icon'

export const IconOnly = () => (
  <Button>
    <Mail className="mr-2 h-4 w-4" /> Login with Email
  </Button>
)

IconOnly.storyName = 'Icon Only'

export const Loading = () => (
  <Button disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Please wait
  </Button>
)

Loading.storyName = 'Loading'

export const WithIcon = () => (
  <Button>
    <Mail className="mr-2" />
    Login with Email
  </Button>
)

WithIcon.storyName = 'With Icon'

// export const AsChild = () => (
//   <Button>
//     <Link href="/">Login</Link>
//   </Button>
// )

// AsChild.storyName = 'As Child'

export default meta
