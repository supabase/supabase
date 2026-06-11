import type { Meta, StoryObj } from '@storybook/react-vite'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { Button, Calendar, Card, CardContent, CardFooter, Form, FormControl, FormField } from 'ui'

import { FormItemLayout } from '../form/FormItemLayout/FormItemLayout'
import { DatePicker, DatePickerButton, DatePickerContent, DatePickerTrigger } from './DatePicker'

const meta = {
  component: DatePicker,
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: () => {
    const form = useForm()
    const onSubmit = (data) => {
      console.log(data)
    }
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Date Picker"
                    description="Date selection with calendar popover"
                  >
                    <FormControl>
                      <DatePicker>
                        <DatePickerTrigger asChild>
                          <DatePickerButton type="default">
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          </DatePickerButton>
                        </DatePickerTrigger>
                        <DatePickerContent>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </DatePickerContent>
                      </DatePicker>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              <Button type="primary" htmlType="submit" disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    )
  },
}
