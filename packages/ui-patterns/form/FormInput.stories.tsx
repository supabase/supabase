// import { useArgs } from '@storybook/preview-api'
import { StoryObj, StoryContext } from '@storybook/react'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormInput } from './FormInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
// import { action } from '@storybook/addon-actions'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form Data Inputs/FormInput',
  component: FormInput,
  decorators: [
    (Story: any) => {
      return (
        <>
          <Story />
        </>
      )
    },
  ],

  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      controls: { exclude: ['style'] },
      source: {
        language: 'tsx',
        // code: `
        //   No
        // `,
        // excludeDecorators: true,
        // format:
        type: 'auto',
        transform: (code: string, StoryContext: StoryContext) => {
          let _code = code
          // _code = _code.replace('<FormProvider', '<Form')
          _code = _code.replace(
            `FormProvider
  clearErrors={() => {}}
  control={{
    _defaultValues: {
      username: ''
    },
    _executeSchema: () => {},
    _fields: {},
    _formState: {
      dirtyFields: {},
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitSuccessful: false,
      isSubmitted: false,
      isSubmitting: false,
      isValid: false,
      isValidating: false,
      submitCount: 0,
      touchedFields: {}
    },
    _formValues: {
      username: ''
    },
    _getDirty: () => {},
    _getFieldArray: () => {},
    _getWatch: () => {},
    _names: {
      array: {},
      mount: {},
      unMount: {},
      watch: {}
    },
    _options: {
      defaultValues: {
        username: ''
      },
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      resolver: () => {},
      shouldFocusError: true
    },
    _proxyFormState: {
      dirtyFields: false,
      errors: false,
      isDirty: false,
      isValid: false,
      isValidating: false,
      touchedFields: false
    },
    _removeUnmounted: () => {},
    _reset: () => {},
    _resetDefaultValues: () => {},
    _state: {
      action: false,
      mount: false,
      watch: false
    },
    _subjects: {
      array: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      },
      state: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      },
      values: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      }
    },
    _updateDisabledField: () => {},
    _updateFieldArray: () => {},
    _updateFormState: () => {},
    _updateValid: () => {},
    getFieldState: () => {},
    handleSubmit: () => {},
    register: () => {},
    setError: () => {},
    unregister: () => {}
  }}
  formState={{
    defaultValues: {
      username: ''
    }
  }}
  getFieldState={() => {}}
  getValues={() => {}}
  handleSubmit={() => {}}
  register={() => {}}
  reset={() => {}}
  resetField={() => {}}
  setError={() => {}}
  setFocus={() => {}}
  setValue={() => {}}
  trigger={() => {}}
  unregister={() => {}}
  watch={() => {}}
>`,
            `Form_shadcn_ {...form}>`
          )
          _code = _code.replace(
            `control={{
        _defaultValues: {
          username: ''
        },
        _executeSchema: () => {},
        _fields: {},
        _formState: {
          dirtyFields: {},
          errors: {},
          isDirty: false,
          isLoading: false,
          isSubmitSuccessful: false,
          isSubmitted: false,
          isSubmitting: false,
          isValid: false,
          isValidating: false,
          submitCount: 0,
          touchedFields: {}
        },
        _formValues: {
          username: ''
        },
        _getDirty: () => {},
        _getFieldArray: () => {},
        _getWatch: () => {},
        _names: {
          array: {},
          mount: {},
          unMount: {},
          watch: {}
        },
        _options: {
          defaultValues: {
            username: ''
          },
          mode: 'onSubmit',
          reValidateMode: 'onChange',
          resolver: () => {},
          shouldFocusError: true
        },
        _proxyFormState: {
          defaultValues: 'all',
          dirtyFields: false,
          errors: false,
          isDirty: false,
          isValid: false,
          isValidating: false,
          touchedFields: false
        },
        _removeUnmounted: () => {},
        _reset: () => {},
        _resetDefaultValues: () => {},
        _state: {
          action: false,
          mount: false,
          watch: false
        },
        _subjects: {
          array: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          },
          state: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          },
          values: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          }
        },
        _updateDisabledField: () => {},
        _updateFieldArray: () => {},
        _updateFormState: () => {},
        _updateValid: () => {},
        getFieldState: () => {},
        handleSubmit: () => {},
        register: () => {},
        setError: () => {},
        unregister: () => {}
      }}`,
            `control={form.control}`
          )

          _code = _code.replace('</FormProvider>', '</Form_Shadcn_>')
          return _code
        },
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // argTypes: {},
}

// export default meta

type Story = StoryObj<typeof FormInput>

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
})

export const Template: Story = {
  render: function Render(args) {
    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        username: '',
      },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
      // Do something with the form values.
      // ✅ This will be type-safe and validated.
      console.log(values)
      // action('form form.handleSubmit(onSubmit)')(values)
    }
    return (
      <Form_Shadcn_ {...form}>
        <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormInput
            label="Username"
            description="this is the description"
            labelOptional="optional"
            placeholder="shadcn"
            control={form.control}
            name="username"
          />
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {
    className: 'border bg-yellow',
    // field: '...field',
    // if you need general args add them here
  },
}

// export const Primary: Story = {
//   /**
//    * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
//    * If you are not concerned with linting, you may use an arrow function.
//    */
//   render: function Render(args) {
//     // const [, setArgs] = useArgs()

//     // 1. Define your form.
//     const form = useForm<z.infer<typeof formSchema>>({
//       resolver: zodResolver(formSchema),
//       defaultValues: {
//         username: '',
//       },
//     })

//     // 2. Define a submit handler.
//     function onSubmit(values: z.infer<typeof formSchema>) {
//       // Do something with the form values.
//       // ✅ This will be type-safe and validated.
//       console.log(values)
//       // action('form form.handleSubmit(onSubmit)')(values)
//     }

//     return (
//       <>
//         <Form_Shadcn_ {...form}>
//           <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
//             <FormField_Shadcn_
//               control={form.control}
//               name="username"
//               render={({ field }) => (
//                 <FormItem_Shadcn_>
//                   <FormLabel_Shadcn_>Username</FormLabel_Shadcn_>
//                   <FormControl_Shadcn_>
//                     <Input_Shadcn_ placeholder="shadcn" {...field} />
//                   </FormControl_Shadcn_>
//                   <FormMessage_Shadcn_ />
//                 </FormItem_Shadcn_>
//               )}
//             />
//             <div className="flex flex-row justify-end">
//               <Button size="small" type="alternative" htmlType="submit">
//                 Submit
//               </Button>
//             </div>
//           </form>
//         </Form_Shadcn_>
//       </>
//     )
//   },
//   args: {
//     className: 'border bg-yellow',
//     // if you need general args add them here
//   },
// }
