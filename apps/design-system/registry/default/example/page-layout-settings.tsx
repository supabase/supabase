import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

const RefreshTokenSchema = z.object({
  REFRESH_TOKEN_ROTATION_ENABLED: z.boolean(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: z.coerce.number().min(0),
})

const UserSessionsSchema = z.object({
  SESSIONS_TIMEBOX: z.coerce.number().min(0),
  SESSIONS_INACTIVITY_TIMEOUT: z.coerce.number().min(0),
  SESSIONS_SINGLE_PER_USER: z.boolean(),
})

function HoursOrNeverText({ value }: { value: number }) {
  if (value === 0) {
    return 'never'
  } else if (value === 1) {
    return 'hour'
  } else {
    return 'hours'
  }
}

export default function PageLayoutSettings() {
  const refreshTokenForm = useForm<z.infer<typeof RefreshTokenSchema>>({
    resolver: zodResolver(RefreshTokenSchema),
    defaultValues: {
      REFRESH_TOKEN_ROTATION_ENABLED: false,
      SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10,
    },
  })

  const userSessionsForm = useForm<z.infer<typeof UserSessionsSchema>>({
    resolver: zodResolver(UserSessionsSchema),
    defaultValues: {
      SESSIONS_TIMEBOX: 0,
      SESSIONS_INACTIVITY_TIMEOUT: 0,
      SESSIONS_SINGLE_PER_USER: false,
    },
  })

  return (
    <div className="w-full">
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>User Sessions</PageHeaderTitle>
            <PageHeaderDescription>
              Configure settings for user sessions and refresh tokens
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="default">
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Refresh Tokens</PageSectionTitle>
              <PageSectionDescription>
                Configure refresh token rotation and security settings.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Form_Shadcn_ {...refreshTokenForm}>
              <form className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <FormField_Shadcn_
                      control={refreshTokenForm.control}
                      name="REFRESH_TOKEN_ROTATION_ENABLED"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Detect and revoke potentially compromised refresh tokens"
                          description="Prevent replay attacks from potentially compromised refresh tokens."
                        >
                          <FormControl_Shadcn_>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={refreshTokenForm.control}
                      name="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Refresh token reuse interval"
                          description="Time interval where the same refresh token can be used multiple times to request for an access token. Recommendation: 10 seconds."
                        >
                          <FormControl_Shadcn_>
                            <PrePostTab postTab="seconds">
                              <Input_Shadcn_ type="number" min={0} {...field} />
                            </PrePostTab>
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-end space-x-2">
                    {refreshTokenForm.formState.isDirty && (
                      <Button type="default" onClick={() => refreshTokenForm.reset()}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!refreshTokenForm.formState.isDirty}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>User Sessions</PageSectionTitle>
              <PageSectionDescription>
                Configure session timeout and single session enforcement settings.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Form_Shadcn_ {...userSessionsForm}>
              <form className="space-y-4">
                <Card>
                  <CardContent>
                    <FormField_Shadcn_
                      control={userSessionsForm.control}
                      name="SESSIONS_SINGLE_PER_USER"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Enforce single session per user"
                          description="If enabled, all but a user's most recently active session will be terminated."
                        >
                          <FormControl_Shadcn_>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>

                  <CardContent>
                    <FormField_Shadcn_
                      control={userSessionsForm.control}
                      name="SESSIONS_TIMEBOX"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Time-box user sessions"
                          description="The amount of time before a user is forced to sign in again. Use 0 for never."
                        >
                          <div className="flex items-center">
                            <FormControl_Shadcn_>
                              <PrePostTab postTab={<HoursOrNeverText value={field.value || 0} />}>
                                <Input_Shadcn_ type="number" min={0} {...field} />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </div>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>

                  <CardContent>
                    <FormField_Shadcn_
                      control={userSessionsForm.control}
                      name="SESSIONS_INACTIVITY_TIMEOUT"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Inactivity timeout"
                          description="The amount of time a user needs to be inactive to be forced to sign in again. Use 0 for never."
                        >
                          <div className="flex items-center">
                            <FormControl_Shadcn_>
                              <PrePostTab postTab={<HoursOrNeverText value={field.value || 0} />}>
                                <Input_Shadcn_ type="number" {...field} />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </div>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>

                  <CardFooter className="justify-end space-x-2">
                    {userSessionsForm.formState.isDirty && (
                      <Button type="default" onClick={() => userSessionsForm.reset()}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!userSessionsForm.formState.isDirty}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}
