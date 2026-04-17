import { ConsentToast } from '.'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast, Toaster } from 'sonner'
import { expect, fn } from 'storybook/test'
import { Button } from 'ui'

const meta = {
  title: 'UI Patterns/ConsentToast',
  component: ConsentToast,
  args: {
    onAccept: fn(),
    onOptOut: fn(),
  },
} satisfies Meta<typeof ConsentToast>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Accept'))
    await expect(args.onAccept).toHaveBeenCalled()
    await userEvent.click(canvas.getByText('Opt out'))
    await expect(args.onOptOut).toHaveBeenCalled()
  },
}

export const InsideToast: Story = {
  render: (props, { globals: { theme } }) => (
    <>
      <Toaster theme={theme} />
      <div>
        <Button
          onClick={() => {
            const toastId = toast(
              <ConsentToast
                {...props}
                onAccept={() => {
                  toast.dismiss(toastId)
                  props.onAccept()
                }}
                onOptOut={() => {
                  toast.dismiss(toastId)
                  props.onOptOut()
                }}
              />,
              {
                duration: Number.POSITIVE_INFINITY,
              }
            )
          }}
        >
          Show Toast
        </Button>
      </div>
    </>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Show Toast'))
    await userEvent.click(canvas.getByText('Accept'))
    await expect(args.onAccept).toHaveBeenCalled()
    await userEvent.click(canvas.getByText('Opt out'))
    await expect(args.onOptOut).toHaveBeenCalled()
  },
}
