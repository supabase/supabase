import { Button } from '.'
import { IconPackage } from '../Icon/icons/IconPackage'
import { IconChevronRight } from '../Icon/icons/IconChevronRight'

export default {
  title: 'General/Button',
  component: Button,
}

export const Neutral = (args: any) => <Button {...args}>Button text</Button>
export const Success = (args: any) => <Button {...args}>Button text</Button>
export const withStyles = (args: any) => <Button {...args}>Button text</Button>
export const withIcon = (args: any) => <Button {...args}>Button text</Button>
export const withIconRight = (args: any) => <Button {...args}>Button text</Button>
export const withBlock = (args: any) => <Button {...args}>Button text</Button>
export const withOnlyIcon = (args: any) => <Button {...args} />
export const withOnlyLoading = (args: any) => <Button {...args} />
export const withLoadingCentered = (args: any) => (
  <Button {...args}>Loading icon is centered</Button>
)

export const allButtons = (args: any) => (
  <>
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4">
        <Button {...args} size="tiny">
          Button text
        </Button>
        <Button {...args} size="tiny" type="default">
          Button text
        </Button>
        <Button {...args} size="tiny" type="secondary">
          Button text
        </Button>
        <Button {...args} size="tiny" type="alternative">
          Button text
        </Button>
        <Button {...args} size="tiny" type="link">
          Button text
        </Button>
        <Button {...args} size="tiny" type="text">
          Button text
        </Button>
        <Button {...args} size="tiny" type="dashed">
          Button text
        </Button>
        <Button {...args} size="tiny" type="outline">
          Button text
        </Button>
        <Button {...args} size="tiny" type="danger">
          Button text
        </Button>
        <Button {...args} size="tiny" type="warning">
          Button text
        </Button>
      </div>

      <div className="flex space-x-4">
        <Button {...args} size="small">
          Button text
        </Button>
        <Button {...args} size="small" type="default">
          Button text
        </Button>
        <Button {...args} size="small" type="secondary">
          Button text
        </Button>
        <Button {...args} size="small" type="alternative">
          Button text
        </Button>
        <Button {...args} size="small" type="link">
          Button text
        </Button>
        <Button {...args} size="small" type="text">
          Button text
        </Button>
        <Button {...args} size="small" type="dashed">
          Button text
        </Button>
        <Button {...args} size="small" type="outline">
          Button text
        </Button>
        <Button {...args} size="small" type="danger">
          Button text
        </Button>
        <Button {...args} size="small" type="warning">
          Button text
        </Button>
      </div>
      <div className="flex space-x-4">
        <Button {...args} size="medium">
          Button text
        </Button>
        <Button {...args} size="medium" type="default">
          Button text
        </Button>
        <Button {...args} size="medium" type="secondary">
          Button text
        </Button>
        <Button {...args} size="medium" type="alternative">
          Button text
        </Button>
        <Button {...args} size="medium" type="link">
          Button text
        </Button>
        <Button {...args} size="medium" type="text">
          Button text
        </Button>
        <Button {...args} size="medium" type="dashed">
          Button text
        </Button>
        <Button {...args} size="medium" type="outline">
          Button text
        </Button>
        <Button {...args} size="medium" type="danger">
          Button text
        </Button>
        <Button {...args} size="medium" type="warning">
          Button text
        </Button>
      </div>
      <div className="flex space-x-4">
        <Button {...args} size="large">
          Button text
        </Button>
        <Button {...args} size="large" type="default">
          Button text
        </Button>
        <Button {...args} size="large" type="secondary">
          Button text
        </Button>
        <Button {...args} size="large" type="alternative">
          Button text
        </Button>
        <Button {...args} size="large" type="link">
          Button text
        </Button>
        <Button {...args} size="large" type="text">
          Button text
        </Button>
        <Button {...args} size="large" type="dashed">
          Button text
        </Button>
        <Button {...args} size="large" type="outline">
          Button text
        </Button>
        <Button {...args} size="large" type="danger">
          Button text
        </Button>
        <Button {...args} size="large" type="warning">
          Button text
        </Button>
      </div>
      <div className="flex space-x-4">
        <Button {...args} size="xlarge">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="default">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="secondary">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="alternative">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="link">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="text">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="dashed">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="outline">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="danger">
          Button text
        </Button>
        <Button {...args} size="xlarge" type="warning">
          Button text
        </Button>
      </div>
    </div>
  </>
)

export const withCustomTag = (args: any) => <Button {...args}>Button text</Button>

const icon = <IconPackage />

withIcon.args = {
  type: 'primary',
  icon: icon,
}

withIconRight.args = {
  type: 'primary',
  iconRight: <IconChevronRight strokeWidth={2} />,
}

withStyles.args = {
  type: 'primary',
  style: { backgroundColor: 'red', color: 'yellow' },
}

withBlock.args = {
  type: 'primary',
  block: true,
}

withOnlyIcon.args = {
  icon: icon,
}

withOnlyLoading.args = {
  loading: true,
}

withLoadingCentered.args = {
  loading: true,
  loadingCentered: true,
}

allButtons.args = {
  loading: false,
  danger: false,
}

withCustomTag.args = {
  as: 'span',
}
