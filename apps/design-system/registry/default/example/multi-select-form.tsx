'use client'

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import {
  Form_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  useToast,
} from 'ui'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'ui'
import { Button } from 'ui'
import Image from 'next/image'

const form = z.object({
  value: z.array(z.string()).nonempty('Please select at least one person'),
})

type Form = z.infer<typeof form>

const users = [
  {
    name: 'ThePrimeagen',
    picture: 'https://pbs.twimg.com/profile_images/1759330620160049152/2i_wkOoK_400x400.jpg',
  },
  {
    name: 'Shadcn',
    picture: 'https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg',
  },
  {
    name: 'Theo',
    picture: 'https://pbs.twimg.com/profile_images/1605762947686375425/lsoGWWty_400x400.jpg',
  },
]

const MultiSelectZod = () => {
  const multiForm = useForm<Form>({
    resolver: zodResolver(form),
    defaultValues: form.parse({ value: [users[0].name] }),
  })

  const { toast } = useToast()
  const onSubmit = (data: Form) => {
    toast({
      title: 'Form submitted ',
      description: JSON.stringify(data, null, 2),
    })
  }

  return (
    <Form_Shadcn_ {...multiForm}>
      <form onSubmit={multiForm.handleSubmit(onSubmit)} className="space-y-3 grid gap-3 w-full">
        <FormField_Shadcn_
          control={multiForm.control}
          name="value"
          render={({ field }) => (
            <FormItem_Shadcn_ className="w-full">
              <FormLabel_Shadcn_>Invite people</FormLabel_Shadcn_>
              <MultiSelector onValuesChange={field.onChange} values={field.value} size={'small'}>
                <MultiSelectorTrigger>
                  <MultiSelectorInput placeholder="Select people to invite" />
                </MultiSelectorTrigger>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {users.map((user) => (
                      <MultiSelectorItem key={user.name} value={user.name}>
                        <div className="flex items-center space-x-2">
                          <Image
                            src={user.picture}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                          <span>{user.name}</span>
                        </div>
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
              <FormDescription_Shadcn_>
                Select people to invite to this event
              </FormDescription_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <Button type="secondary" size="medium" htmlType="submit">
          Submit
        </Button>
      </form>
    </Form_Shadcn_>
  )
}

export default MultiSelectZod
