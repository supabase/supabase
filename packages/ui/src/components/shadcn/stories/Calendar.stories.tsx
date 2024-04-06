import { Meta } from '@storybook/react'
import * as React from 'react'
import { Calendar } from '../ui/calendar'

const meta: Meta = {
  title: 'shadcn/Calendar',
  component: Calendar,
}

export const Default = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="flex items-center justify-center">
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
    </div>
  )
}

// export const withForm = () => {
//   const FormSchema = z.object({
//     dob: z.date({
//       required_error: 'A date of birth is required.',
//     }),
//   })

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
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
//         <FormField
//           control={form.control}
//           name="dob"
//           render={({ field }) => (
//             <FormItem className="flex flex-col">
//               <FormLabel>Date of birth</FormLabel>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <FormControl>
//                     <Button
//                       variant={'outline'}
//                       className={cn(
//                         'w-[240px] pl-3 text-left font-normal',
//                         !field.value && 'text-foreground-muted'
//                       )}
//                     >
//                       {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
//                       <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                     </Button>
//                   </FormControl>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={field.value}
//                     onSelect={(e) => {
//                       // @mildtomato - guard in case returns undefined
//                       if (e) {
//                         field.onChange(e)
//                       }
//                     }}
//                     disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//               <FormDescription>Your date of birth is used to calculate your age.</FormDescription>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <Button type="submit" variant={'secondary'}>
//           Submit
//         </Button>
//       </form>
//     </Form>
//   )
// }

// withForm.storyName = 'With Form'

export default meta
