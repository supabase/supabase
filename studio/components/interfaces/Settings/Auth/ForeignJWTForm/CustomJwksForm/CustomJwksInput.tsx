import { observer } from 'mobx-react-lite'
import { Form } from 'ui'

import { useParams } from 'common'
import CodeEditor from 'components/ui/CodeEditor'
import { FormActions, FormSection, FormSectionContent } from 'components/ui/Forms'
import { useJwtSecretUpdateMutation } from 'data/config/jwt-secret-update-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useEffect } from 'react'
import { object, string } from 'yup'

const formSchema = object({
  JWKS: string()
    .required()
    .test({
      test: (v, ctx) => {
        if (v === undefined || v === null) {
          return ctx.createError({ message: "The JWKS can't be undefined." })
        }
        if (v === '') {
          return true
        }
        try {
          JSON.parse(v)
          return true
        } catch (e) {
          return ctx.createError({ message: "The JWKS can't be malformed JSON." })
        }
      },
    }),
})

export const CustomJwksInput = observer(() => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const { data: postgrestConfig, isLoading } = useProjectPostgrestConfigQuery({
    projectRef,
  })

  const formId = `auth-config-jwks-input`
  const INITIAL_VALUES: { JWKS: string } = { JWKS: '' }

  const { mutateAsync: updateJwt, isLoading: isSubmittingJwtSecretUpdateRequest } =
    useJwtSecretUpdateMutation()

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    const trackingId = uuidv4()
    const res = await updateJwt({
      projectRef: projectRef!,
      jwtCustomJwks: values.JWKS,
      changeTrackingId: trackingId,
    })
    console.log(res)

    setSubmitting(false)
  }

  if (isLoading) {
    return <div></div>
  }

  return (
    <Form
      id={formId}
      className="!border-t-0"
      initialValues={INITIAL_VALUES}
      onSubmit={onSubmit}
      validationSchema={formSchema}
    >
      {({ isSubmitting, resetForm, values, setFieldValue, errors }: any) => {
        const hasChanges = values.JWKS !== postgrestConfig?.jwt_custom_jwks

        useEffect(() => {
          resetForm({ values: { JWKS: postgrestConfig?.jwt_custom_jwks } })
        }, [resetForm])

        console.log(errors)

        return (
          <FormSection>
            <FormSectionContent fullWidth loading={isLoading}>
              <div className="relative h-96">
                <CodeEditor
                  id="code-id"
                  language="html"
                  className="!mb-0 h-96 overflow-hidden rounded-md border"
                  onInputChange={(e) => setFieldValue('JWKS', e || '', true)}
                  options={{ wordWrap: 'off', contextmenu: false }}
                  value={values.JWKS}
                />
                {errors.JWKS && (
                  <p
                    data-state="show"
                    className="text-red-900 transition-all data-show:mt-2 data-show:animate-slide-down-normal data-hide:animate-slide-up-normal text-sm"
                  >
                    {errors.JWKS}
                  </p>
                )}
              </div>
              <div className="col-span-12 flex w-full">
                <FormActions
                  handleReset={() =>
                    resetForm({ values: { JWKS: postgrestConfig?.jwt_custom_jwks } })
                  }
                  form={formId}
                  isSubmitting={isSubmitting}
                  hasChanges={hasChanges}
                  disabled={errors.JWKS !== undefined}
                />
              </div>
            </FormSectionContent>
          </FormSection>
        )
      }}
    </Form>
  )
})
