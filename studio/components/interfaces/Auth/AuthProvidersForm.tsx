import {
  Alert,
  Button,
  Collapsible,
  Form,
  IconCheck,
  IconChevronUp,
  Input,
  InputNumber,
  Listbox,
  Toggle,
} from '@supabase/ui'
import { FormHeader } from 'components/ui/Forms'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { PROVIDERS_SCHEMAS } from 'stores/authConfig/schema'

interface Enum {
  label: string
  value: string
  icon: string
}
interface Provider {
  $schema: string
  type: 'object'
  title: string
  properties: {
    [x: string]: {
      title: string
      type: 'boolean' | 'string' | 'select' | 'number'
      description?: string
      descriptionOptional?: string
      enum: Enum[]
      show: {
        key: string
        matches: string
      }
    }
  }
  validationSchema: any // todo: use Yup type
  misc: {
    iconKey: 'gitlab-icon'
    requiresRedirect: true
    helper: string
    alert: {
      title: string
      description: string
    }
  }
}

const ProviderCollapsibleClasses = [
  'bg-scale-100 dark:bg-scale-300 ',
  'hover:bg-scale-200 dark:hover:bg-scale-500',
  'data-open:bg-scale-200 dark:data-open:bg-scale-500 ',
  'border-scale-300 ',
  'dark:border-scale-500 hover:border-scale-500 ',
  'dark:hover:border-scale-700 data-open:border-scale-700',
  'data-open:pb-px col-span-12 mx-auto',
  '-space-y-px overflow-hidden',
  'border shadow',
  'transition',
  'first:rounded-tl',
  'first:rounded-tr',
  'last:rounded-bl',
  'last:rounded-br',
  'hover:z-50',
]

const AuthProvidersForm = () => {
  const providers = PROVIDERS_SCHEMAS
  const { authConfig } = useStore()

  return (
    <div>
      <FormHeader
        title="Auth Providers"
        description={`URLs that auth providers are permitted to redirect to post authentication`}
      />

      <div className="-space-y-px">
        {!authConfig.isLoaded
          ? providers.map((i) => (
              <div className={ProviderCollapsibleClasses.join(' ')}>
                <HorizontalShimmerWithIcon />
              </div>
            ))
          : // @ts-expect-error
            // to do: fix type error, needs to be dynamic
            providers.map((provider: Provider, i) => {
              return <ProviderForm provider={provider} key={i} />
            })}
      </div>
    </div>
  )
}

const ProviderForm = ({ provider }: { provider: Provider }) => {
  const [open, setOpen] = useState(false)
  const { authConfig, ui } = useStore()
  const active = authConfig.config[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]
  const INITIAL_VALUES: { [x: string]: string } = {}

  /**
   * construct values for INITIAL_VALUES
   *
   * return empty string `""` rather than `null`
   * as it breaks form. null is not a valid value.
   */
  Object.keys(provider.properties).forEach((key) => {
    INITIAL_VALUES[key] = authConfig.config[key] ?? ''
  })

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={ProviderCollapsibleClasses.join(' ')}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="
              text-scale-1200
              group
              flex 
              w-full items-center justify-between rounded 
              p-3 px-6"
        >
          <div className="flex items-center gap-3">
            <IconChevronUp
              className="text-scale-800 data-open-parent:rotate-0 data-closed-parent:rotate-180 transition"
              strokeWidth={2}
              width={14}
            />

            <img
              src={`/img/icons/${provider.misc.iconKey}.svg`}
              width={18}
              alt={`${provider.title} auth icon`}
            />

            <span className="text-sm">{provider.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {active ? (
              <div className="bg-brand-200 border-brand-700 text-brand-900 flex items-center gap-1 rounded-full border py-1 px-1 text-xs">
                <span className="bg-brand-900 text-brand-200 rounded-full p-0.5 text-xs">
                  <IconCheck strokeWidth={2} size={12} />
                </span>
                <span className="px-1">Enabled</span>
              </div>
            ) : (
              <div className="bg-scale-100 dark:bg-scale-300 border-scale-500 dark:border-scale-700 text-scale-900 rounded-md border py-1 px-3 text-xs">
                Disabled
              </div>
            )}
          </div>
        </button>
      </Collapsible.Trigger>
      <Form
        name={`provider-${provider.title}-form`}
        initialValues={INITIAL_VALUES}
        validationSchema={provider.validationSchema}
        onSubmit={async (values: any, { setSubmitting }: any) => {
          try {
            await authConfig.update(values)
            setSubmitting(false)
            setOpen(false)
          } catch (error) {
            console.error(error)
          }
        }}
      >
        {({ isSubmitting, handleReset, values }: any) => {
          const noChanges = JSON.stringify(INITIAL_VALUES) === JSON.stringify(values)

          // if (open) {
          //   handleReset()
          // }

          return (
            <Collapsible.Content>
              <div
                className="
                  bg-scale-100 dark:bg-scale-300
                  text-scale-1200 border-scale-500 group border-t py-6 px-6
                "
              >
                <div className="mx-auto my-6 max-w-md space-y-6">
                  {Object.keys(provider.properties).map((x: string) => {
                    /**
                     * Properties of the form
                     */
                    const properties = provider.properties[x]

                    /**
                     * Conditionally hide properties based on value of key
                     */
                    if (
                      properties.show &&
                      values[properties.show.key] !== properties.show.matches
                    ) {
                      return null
                    }

                    switch (properties.type) {
                      case 'string':
                        return (
                          <Input
                            size="small"
                            layout="vertical"
                            id={x}
                            key={x}
                            name={x}
                            label={properties.title}
                            descriptionText={
                              properties.description ? (
                                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                                  {properties.description}
                                </ReactMarkdown>
                              ) : null
                            }
                            //
                            // @ts-expect-error
                            //
                            // to do: change to "string" | React.ReactNode | undefined
                            //
                            labelOptional={
                              properties.descriptionOptional ? (
                                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                                  {properties.descriptionOptional}
                                </ReactMarkdown>
                              ) : null
                            }
                          />
                        )
                        break

                      case 'number':
                        return (
                          <InputNumber
                            size="small"
                            layout="vertical"
                            id={x}
                            key={x}
                            name={x}
                            // style={{ width: '50%' }}
                            label={properties.title}
                            // @ts-expect-error
                            descriptionText={
                              properties.description ? (
                                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                                  {properties.description}
                                </ReactMarkdown>
                              ) : null
                            }
                            //
                            // @ts-expect-error
                            //
                            // to do: change to "string" | React.ReactNode | undefined
                            //
                            labelOptional={
                              properties.descriptionOptional ? (
                                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                                  {properties.descriptionOptional}
                                </ReactMarkdown>
                              ) : null
                            }
                          />
                        )
                        break

                      case 'boolean':
                        return (
                          <Toggle
                            size="small"
                            // layout="horizontal"
                            key={x}
                            name={x}
                            label={properties.title}
                            descriptionText={properties.description}
                          />
                        )
                        break

                      case 'select':
                        return (
                          <Listbox
                            size="small"
                            key={x}
                            name={x}
                            label={properties.title}
                            descriptionText={properties.description}
                            defaultValue={properties.enum[0]}
                          >
                            {properties.enum.map((option: Enum) => {
                              return (
                                <Listbox.Option
                                  id={option.value}
                                  label={option.label}
                                  value={option.value}
                                  addOnBefore={() => (
                                    <img className="h-6 w-6" src={`/img/icons/${option.icon}`} />
                                  )}
                                >
                                  {option.label}
                                </Listbox.Option>
                              )
                            })}
                          </Listbox>
                        )
                        break

                      default:
                        break
                    }
                  })}
                  {provider?.misc?.alert && (
                    <Alert title={provider.misc.alert.title} variant="warning" withIcon>
                      <ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>
                    </Alert>
                  )}
                  {provider.misc.requiresRedirect && (
                    <>
                      <ReactMarkdown className="text-scale-900 text-xs">
                        {provider.misc.helper}
                      </ReactMarkdown>
                      <Input
                        label="Redirect url"
                        readOnly
                        value={`https://${ui.selectedProjectRef}.supabase.co/auth/v1/callback`}
                        copy
                        disabled
                      />
                    </>
                  )}
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      htmlType="reset"
                      onClick={() => {
                        handleReset()
                        setOpen(false)
                      }}
                      type="default"
                    >
                      Cancel
                    </Button>
                    <Button htmlType="submit" loading={isSubmitting} disabled={noChanges}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </Collapsible.Content>
          )
        }}
      </Form>
    </Collapsible>
  )
}

export default observer(AuthProvidersForm)
