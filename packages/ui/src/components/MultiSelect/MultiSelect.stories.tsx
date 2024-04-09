import { zodResolver } from '@hookform/resolvers/zod'
import { Meta } from '@storybook/react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '../Button/Button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../shadcn/ui/form'
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
} from './MultiSelect'
import { useState } from 'react'

// const FormSchema = z.object({
//   username: z.string().min(2, {
//     message: 'Username must be at least 2 characters.',
//   }),
// })

const meta: Meta = {
  title: 'shadcn/MultiSelect',
  component: MultiSelector,
}

export function Default() {
  const [value, setValue] = useState<string[]>([])

  return (
    <MultiSelector values={value} onValuesChange={setValue}>
      <MultiSelectorTrigger>
        <MultiSelectorInput placeholder="Select items" />
      </MultiSelectorTrigger>
      <MultiSelectorContent>
        <MultiSelectorList>
          <MultiSelectorItem value="1">Item 1</MultiSelectorItem>
          <MultiSelectorItem value="2">Item 2</MultiSelectorItem>
          <MultiSelectorItem value="3">Item 3</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}

// export function InputForm() {
//   const form = useForm<z.infer<typeof FormSchema>>({
//     resolver: zodResolver(FormSchema),
//   })

//   function onSubmit(data: z.infer<typeof FormSchema>) {
//     toast({
//       title: 'You submitted the following values:',
//       description: (
//         <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
//           <code className="text-white">{JSON.stringify(data, null, 2)}</code>
//         </pre>
//       ),
//     })
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
//         <FormField
//           control={form.control}
//           name="username"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Username</FormLabel>
//               <FormControl>
//                 <Input placeholder="shadcn" {...field} />
//               </FormControl>
//               <FormDescription>This is your public display name.</FormDescription>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <Button type="submit">Submit</Button>
//       </form>
//     </Form>
//   )
// }
export default meta
