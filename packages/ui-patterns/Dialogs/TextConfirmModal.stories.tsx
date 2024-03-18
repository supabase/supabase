import { useArgs } from '@storybook/preview-api'
import { StoryObj } from '@storybook/react'
import { Button, IconUserPlus } from 'ui'
import TextConfirmModal from './TextConfirmModal'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Dialogs/TextConfirmModal',
  component: TextConfirmModal,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    title: { control: 'text' },
    cancelLabel: { control: 'text' },
    confirmLabel: { control: 'text' },
  },
}

// export default meta

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
// export const Primary = {
//   args: {
//     size: 'small',
//     // visible: true,
//   },
// }

type Story = StoryObj<typeof TextConfirmModal>

export const Primary: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    title: 'Are you sure you want to delete?',
    size: 'small',
    // label: 'Try Me!',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open text confirm dialog
        </Button>
        <TextConfirmModal
          // visible={visible}
          key="primary"
          {...args}
          onCancel={() => onVisibleChange()}
          // onChange={onChange}

          // isChecked={isChecked}
        />
      </>
    )
  },
}

export const withInfoAlert: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    variant: 'default',
    title: 'Are you sure you want to move?',
    alert: {
      title: 'This is a reminder banner',
      description: 'This should not be used for important CRUD events.',
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()
    // const [visible, setVisibleState] = useState(args.visible)

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal key="withWarningAlert" {...args} onCancel={() => onVisibleChange()} />
      </>
    )
  },
}

export const withWarningAlert: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    variant: 'warning',
    title: 'Are you sure you want to delete?',
    alert: {
      title: 'This is a warning',
      description: 'You are about to delete this item. This action cannot be undone.',
    },
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()
    // const [visible, setVisibleState] = useState(args.visible)

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal key="withWarningAlert" {...args} onCancel={() => onVisibleChange()} />
      </>
    )
  },
}

export const withDestructiveAlert: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    variant: 'destructive',
    title: 'Are you sure you want to delete?',
    alert: {
      title: 'This is a warning',
      description: 'You are about to delete this item. This action cannot be undone.',
    },
    // label: 'Try Me!',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()
    // const [visible, setVisibleState] = useState(args.visible)

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal key="withWarningAlert" {...args} onCancel={() => onVisibleChange()} />
      </>
    )
  },
}

export const withCancelButton: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    variant: 'destructive',
    title: 'Are you sure you want to delete?',
    blockDeleteButton: false,
    // label: 'Try Me!',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()
    // const [visible, setVisibleState] = useState(args.visible)

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal key="withWarningAlert" {...args} onCancel={() => onVisibleChange()} />
      </>
    )
  },
}

export const withChildren: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    variant: 'destructive',
    title: 'Are you sure you want to delete?',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal
          key="withWarningAlert"
          // visible={visible}
          {...args}
          onCancel={() => onVisibleChange()}
          // onChange={onChange}

          // isChecked={isChecked}
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex gap-3 items-center">
              <IconUserPlus className="text-foreground-lighter" />
              <p>
                This is a paragraph <strong>with some bold text</strong>
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <IconUserPlus className="text-foreground-lighter" />
              <p>
                This is a paragraph <strong>with some bold text</strong>
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <IconUserPlus className="text-foreground-lighter" />
              <p>
                This is a paragraph <strong>with some bold text</strong>
              </p>
            </div>
          </div>
        </TextConfirmModal>
      </>
    )
  },
}

export const withSize: Story = {
  args: {
    confirmString: 'project name',
    visible: false,
    size: 'xlarge',
    variant: 'destructive',
    title: 'Are you sure you want to delete?',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    const [{ visible }, updateArgs] = useArgs()

    function onVisibleChange() {
      updateArgs({ visible: !visible })
    }

    return (
      <>
        <Button type="default" onClick={() => onVisibleChange()}>
          Open warning text confirm dialog
        </Button>
        <TextConfirmModal key="withWarningAlert" {...args} onCancel={() => onVisibleChange()} />
      </>
    )
  },
}
