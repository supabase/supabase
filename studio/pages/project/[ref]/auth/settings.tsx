import useSWR from 'swr'
import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AutoField, NumField } from 'uniforms-bootstrap4'
import { Button, Typography, Toggle as UIToggle } from '@supabase/ui'
import Divider from 'components/ui/Divider'

import { API_URL } from 'lib/constants'
import { withAuth, useStore } from 'hooks'
import { authConfig } from 'stores/jsonSchema'
import { get, patch } from 'lib/common/fetch'
import { pluckJsonSchemaFields } from 'lib/helpers'
import { AuthLayout } from 'components/layouts'
import Table from 'components/to-be-cleaned/Table'
import Panel from 'components/to-be-cleaned/Panel'
import Toggle from 'components/to-be-cleaned/forms/Toggle'
import ToggleField from 'components/to-be-cleaned/forms/ToggleField'
import SecretField from 'components/to-be-cleaned/forms/SecretField'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

const Auth = () => {
  return (
    <AuthLayout title="Auth">
      <div className="p-4">
        <Settings />
      </div>
    </AuthLayout>
  )
}
export default withAuth(observer(Auth))

const Settings = () => {
  const router = useRouter()
  const { ui } = useStore()

  const [model, setModel] = useState<any>({})
  const [smsProviderModel, setSmsProviderModel] = useState<any>({})
  const [externalProvidersModel, setExternalProvidersModel] = useState<any>({})
  const [isCustomSMTPEnabled, setCustomSMTP] = useState<boolean>(false)
  const URL = `${API_URL}/auth/${router.query.ref}/config`
  const { data: config, error }: any = useSWR(URL, get)
  const { ref: projectRef } = router.query

  if (error) {
    return (
      <Typography.Text type="danger">
        <p>Error connecting to API</p>
        <p>{`${error}`}</p>
      </Typography.Text>
    )
  }

  useEffect(() => {
    if (config) {
      const temp =
        config.SMTP_ADMIN_EMAIL ||
        config.SMTP_HOST ||
        config.SMTP_PORT ||
        config.SMTP_USER ||
        config.SMTP_PASS
      setCustomSMTP(temp)
    }
    setModel({ ...config })
    setExternalProvidersModel({ ...config })
  }, [config])

  const onFormSubmit = async (model: any) => {
    for (const [key, value] of Object.entries(model)) {
      // remove any whitespaces in OAuth or Sms provider credentials
      if ((key.includes('EXTERNAL') || key.includes('SMS')) && typeof value === 'string') {
        model[key] = value.replace(/\s/g, '')
      }
    }
    const response = await patch(URL, model)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Update config failed: ${response.error.message}`,
      })
    } else {
      const updates = response
      setModel({ ...updates })
      ui.setNotification({ category: 'success', message: 'Settings saved' })
    }
  }

  /*
   * handleToggle
   *
   * This can be used for toggles that are not in a schema form
   */
  const handleToggle = async (key: any, value?: any) => {
    const payload = {
      [key]: value ? value : !model[key],
    }

    try {
      const response = await patch(URL, payload)
      if (response.error) throw response.error
      const updates = response
      setModel({ ...updates })
      ui.setNotification({ category: 'success', message: 'Settings saved' })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Update config failed: ${error.message}` })
    }
  }

  const onFormReset = () => {
    setExternalProvidersModel({ ...config })
  }

  return (
    <div className="">
      <div className="my-8 mt-0">
        <SchemaFormPanel
          title="General"
          schema={pluckJsonSchemaFields(authConfig, [
            'SITE_URL',
            'URI_ALLOW_LIST',
            'JWT_EXP',
            'DISABLE_SIGNUP',
            'PASSWORD_MIN_LENGTH',
            'SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION',
          ])}
          model={{
            SITE_URL: model.SITE_URL || undefined,
            URI_ALLOW_LIST: model.URI_ALLOW_LIST || undefined,
            DISABLE_SIGNUP: model.DISABLE_SIGNUP,
            JWT_EXP: model.JWT_EXP || undefined,
            PASSWORD_MIN_LENGTH: model.PASSWORD_MIN_LENGTH || undefined,
            SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION: model.SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION || false,
          }}
          onSubmit={(model: any) => onFormSubmit(model)}
        >
          <AutoField
            name="SITE_URL"
            showInlineError
            errorMessage="Please enter a valid site url."
          />
          <AutoField
            name="URI_ALLOW_LIST"
            showInlineError
            errorMessage="Must be a comma separated list of exact URIs. No spaces."
          />
          <NumField name="JWT_EXP" step="1" />
          <NumField name="PASSWORD_MIN_LENGTH" step="1" />
          <ToggleField name="SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION" />
          <ToggleField name="DISABLE_SIGNUP" />
        </SchemaFormPanel>
      </div>
      <div className="my-8 mt-0">
        <SchemaFormPanel
          title="Email Auth"
          schema={pluckJsonSchemaFields(authConfig, [
            'MAILER_SECURE_EMAIL_CHANGE_ENABLED',
            'SMTP_ADMIN_EMAIL',
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_SENDER_NAME',
            'RATE_LIMIT_EMAIL_SENT',
          ])}
          model={{
            MAILER_SECURE_EMAIL_CHANGE_ENABLED: model.MAILER_SECURE_EMAIL_CHANGE_ENABLED,
            SMTP_ADMIN_EMAIL: isCustomSMTPEnabled ? model.SMTP_ADMIN_EMAIL : '',
            SMTP_HOST: isCustomSMTPEnabled ? model.SMTP_HOST : '',
            SMTP_PORT: isCustomSMTPEnabled ? model.SMTP_PORT : '',
            SMTP_USER: isCustomSMTPEnabled ? model.SMTP_USER : '',
            SMTP_PASS: isCustomSMTPEnabled ? model.SMTP_PASS : '',
            SMTP_SENDER_NAME: isCustomSMTPEnabled ? model.SMTP_SENDER_NAME : '',
            RATE_LIMIT_EMAIL_SENT: isCustomSMTPEnabled ? model.RATE_LIMIT_EMAIL_SENT : 30,
          }}
          onSubmit={(model: any) =>
            onFormSubmit({
              ...model,
            })
          }
        >
          <UIToggle
            layout="horizontal"
            className="mb-4"
            label={authConfig.properties.EXTERNAL_EMAIL_ENABLED.title}
            onChange={(value) => {
              handleToggle('EXTERNAL_EMAIL_ENABLED', value)
            }}
            checked={model.EXTERNAL_EMAIL_ENABLED}
            descriptionText={authConfig.properties.EXTERNAL_EMAIL_ENABLED.help}
          />

          <UIToggle
            layout="horizontal"
            className="mb-4"
            label={authConfig.properties.MAILER_SECURE_EMAIL_CHANGE_ENABLED.title}
            onChange={(value) => {
              handleToggle('MAILER_SECURE_EMAIL_CHANGE_ENABLED', value)
            }}
            checked={model.MAILER_SECURE_EMAIL_CHANGE_ENABLED}
            descriptionText={authConfig.properties.MAILER_SECURE_EMAIL_CHANGE_ENABLED.help}
          />

          <UIToggle
            layout="horizontal"
            className="mb-4"
            label={authConfig.properties.MAILER_AUTOCONFIRM.title}
            onChange={(value) => {
              // If MAILER_AUTOCONFIRM is set to true, it means we are disabling email confirmations.
              // "Enable email confirmations" should be toggled off.
              handleToggle('MAILER_AUTOCONFIRM', !value)
            }}
            checked={!model.MAILER_AUTOCONFIRM}
            descriptionText={authConfig.properties.MAILER_AUTOCONFIRM.help}
          />

          <UIToggle
            layout="horizontal"
            className="mb-4"
            label="Enable Custom SMTP"
            checked={isCustomSMTPEnabled}
            onChange={(value: any) => {
              /*
               * temporary solution
               * clear the values of SMTP when toggling
               */
              if (!value) {
                onFormSubmit({
                  SMTP_ADMIN_EMAIL: '',
                  SMTP_HOST: '',
                  SMTP_PORT: '',
                  SMTP_USER: '',
                  SMTP_PASS: '',
                  SMTP_SENDER_NAME: '',
                  RATE_LIMIT_EMAIL_SENT: 30,
                })
              }
              setCustomSMTP(!isCustomSMTPEnabled)
            }}
          />
          {isCustomSMTPEnabled && (
            <>
              <AutoField
                name="SMTP_ADMIN_EMAIL"
                showInlineError
                errorMessage="Please enter from email address."
              />
              <AutoField name="SMTP_HOST" showInlineError errorMessage="Please enter host." />
              <AutoField name="SMTP_PORT" showInlineError errorMessage="Please enter port." />
              <AutoField name="SMTP_USER" showInlineError errorMessage="Please enter user." />
              <SecretField name="SMTP_PASS" errorMessage="Please enter password." />
              <AutoField
                name="SMTP_SENDER_NAME"
                showInlineError
                errorMessage="Please enter from name."
              />
              <NumField
                showInlineError
                step="1"
                name="RATE_LIMIT_EMAIL_SENT"
                errorMessage="Please enter a value between 1 to 32767"
              />
            </>
          )}
        </SchemaFormPanel>
      </div>

      <div className="my-8 mt-0">
        <SchemaFormPanel
          title="Phone Auth"
          schema={pluckJsonSchemaFields(authConfig, [
            'SMS_PROVIDER',
            'SMS_TWILIO_ACCOUNT_SID',
            'SMS_TWILIO_AUTH_TOKEN',
            'SMS_TWILIO_MESSAGE_SERVICE_SID',
            'SMS_MESSAGEBIRD_ORIGINATOR',
            'SMS_MESSAGEBIRD_ACCESS_KEY',
            'SMS_TEXTLOCAL_API_KEY',
            'SMS_TEXTLOCAL_SENDER',
            'SMS_VONAGE_API_KEY',
            'SMS_VONAGE_API_SECRET',
            'SMS_VONAGE_FROM',
          ])}
          model={{
            SMS_PROVIDER: model.SMS_PROVIDER,
            SMS_TEXTLOCAL_API_KEY: model.SMS_TEXTLOCAL_API_KEY || undefined,
            SMS_TEXTLOCAL_SENDER: model.SMS_TEXTLOCAL_SENDER || undefined,
            SMS_TWILIO_ACCOUNT_SID: model.SMS_TWILIO_ACCOUNT_SID || undefined,
            SMS_TWILIO_AUTH_TOKEN: model.SMS_TWILIO_AUTH_TOKEN || undefined,
            SMS_TWILIO_MESSAGE_SERVICE_SID: model.SMS_TWILIO_MESSAGE_SERVICE_SID || undefined,
            SMS_MESSAGEBIRD_ORIGINATOR: model.SMS_MESSAGEBIRD_ORIGINATOR || undefined,
            SMS_MESSAGEBIRD_ACCESS_KEY: model.SMS_MESSAGEBIRD_ACCESS_KEY || undefined,
            SMS_VONAGE_API_KEY: model.SMS_VONAGE_API_KEY || undefined,
            SMS_VONAGE_API_SECRET: model.SMS_VONAGE_API_SECRET || undefined,
            SMS_VONAGE_FROM: model.SMS_VONAGE_FROM || undefined,
          }}
          onChangeModel={(model: any) => setSmsProviderModel(model)}
          onSubmit={(model: any) => onFormSubmit(model)}
        >
          <>
            <UIToggle
              layout="horizontal"
              className="mb-4"
              label={authConfig.properties.EXTERNAL_PHONE_ENABLED.title}
              onChange={() => {
                handleToggle('EXTERNAL_PHONE_ENABLED')
              }}
              checked={model.EXTERNAL_PHONE_ENABLED}
              descriptionText={authConfig.properties.EXTERNAL_PHONE_ENABLED.help}
            />

            {model.EXTERNAL_PHONE_ENABLED && (
              <>
                <AutoField
                  name="SMS_PROVIDER"
                  showInlineError
                  errorMessage="Please enter the phone provider."
                />
                {smsProviderModel?.SMS_PROVIDER === 'messagebird' ? (
                  <>
                    <SecretField
                      name="SMS_MESSAGEBIRD_ACCESS_KEY"
                      showInlineError
                      errorMessage="Please enter the messagebird access key."
                    />
                    <AutoField
                      name="SMS_MESSAGEBIRD_ORIGINATOR"
                      showInlineError
                      errorMessage="Please enter the messagebird originator."
                    />
                  </>
                ) : smsProviderModel?.SMS_PROVIDER === 'textlocal' ? (
                  <>
                    <AutoField
                      name="SMS_TEXTLOCAL_API_KEY"
                      showInlineError
                      errorMessage="Please enter the vonage account sid."
                    />
                    <SecretField
                      name="SMS_TEXTLOCAL_SENDER"
                      showInlineError
                      errorMessage="Please enter the vonage auth token."
                    />
                  </>
                ) : smsProviderModel?.SMS_PROVIDER === 'vonage' ? (
                  <>
                    <AutoField
                      name="SMS_VONAGE_API_KEY"
                      showInlineError
                      errorMessage="Please enter the vonage account sid."
                    />
                    <SecretField
                      name="SMS_VONAGE_API_SECRET"
                      showInlineError
                      errorMessage="Please enter the vonage auth token."
                    />
                    <AutoField
                      name="SMS_VONAGE_FROM"
                      showInlineError
                      errorMessage="Please enter the vonage message service sid."
                    />
                  </>
                ) : (
                  <>
                    <AutoField
                      name="SMS_TWILIO_ACCOUNT_SID"
                      showInlineError
                      errorMessage="Please enter the twilio account sid."
                    />
                    <SecretField
                      name="SMS_TWILIO_AUTH_TOKEN"
                      showInlineError
                      errorMessage="Please enter the twilio auth token."
                    />
                    <AutoField
                      name="SMS_TWILIO_MESSAGE_SERVICE_SID"
                      showInlineError
                      errorMessage="Please enter the twilio message service sid."
                    />
                  </>
                )}
              </>
            )}
            <UIToggle
              layout="horizontal"
              label={authConfig.properties.SMS_AUTOCONFIRM.title}
              onChange={(value) => {
                // If SMS_AUTOCONFIRM is set to true, it means we are disabling phone confirmations.
                // "Enable phone confirmations" should be toggled off.
                handleToggle('SMS_AUTOCONFIRM', !value)
              }}
              //
              checked={!model.SMS_AUTOCONFIRM}
              descriptionText={authConfig.properties.SMS_AUTOCONFIRM.help}
            />
          </>
        </SchemaFormPanel>
      </div>
      <div className="my-8 mt-0">
        <SchemaFormPanel
          title="External OAuth Providers"
          schema={pluckJsonSchemaFields(authConfig, [
            'EXTERNAL_APPLE_ENABLED',
            'EXTERNAL_APPLE_CLIENT_ID',
            'EXTERNAL_APPLE_SECRET',
            'EXTERNAL_AZURE_ENABLED',
            'EXTERNAL_AZURE_CLIENT_ID',
            'EXTERNAL_AZURE_SECRET',
            'EXTERNAL_AZURE_URL',
            'EXTERNAL_BITBUCKET_ENABLED',
            'EXTERNAL_BITBUCKET_CLIENT_ID',
            'EXTERNAL_BITBUCKET_SECRET',
            'EXTERNAL_DISCORD_ENABLED',
            'EXTERNAL_DISCORD_CLIENT_ID',
            'EXTERNAL_DISCORD_SECRET',
            'EXTERNAL_FACEBOOK_ENABLED',
            'EXTERNAL_FACEBOOK_CLIENT_ID',
            'EXTERNAL_FACEBOOK_SECRET',
            'EXTERNAL_GOOGLE_ENABLED',
            'EXTERNAL_GOOGLE_CLIENT_ID',
            'EXTERNAL_GOOGLE_SECRET',
            'EXTERNAL_GITHUB_ENABLED',
            'EXTERNAL_GITHUB_CLIENT_ID',
            'EXTERNAL_GITHUB_SECRET',
            'EXTERNAL_GITLAB_ENABLED',
            'EXTERNAL_GITLAB_CLIENT_ID',
            'EXTERNAL_GITLAB_SECRET',
            'EXTERNAL_LINKEDIN_ENABLED',
            'EXTERNAL_LINKEDIN_CLIENT_ID',
            'EXTERNAL_LINKEDIN_SECRET',
            'EXTERNAL_NOTION_ENABLED',
            'EXTERNAL_NOTION_CLIENT_ID',
            'EXTERNAL_NOTION_SECRET',
            'EXTERNAL_TWITCH_ENABLED',
            'EXTERNAL_TWITCH_CLIENT_ID',
            'EXTERNAL_TWITCH_SECRET',
            'EXTERNAL_TWITTER_ENABLED',
            'EXTERNAL_TWITTER_CLIENT_ID',
            'EXTERNAL_TWITTER_SECRET',
            'EXTERNAL_SLACK_ENABLED',
            'EXTERNAL_SLACK_CLIENT_ID',
            'EXTERNAL_SLACK_SECRET',
            'EXTERNAL_SPOTIFY_ENABLED',
            'EXTERNAL_SPOTIFY_CLIENT_ID',
            'EXTERNAL_SPOTIFY_SECRET',
            'EXTERNAL_ZOOM_ENABLED',
            'EXTERNAL_ZOOM_CLIENT_ID',
            'EXTERNAL_ZOOM_SECRET',
          ])}
          model={{
            EXTERNAL_APPLE_ENABLED: model.EXTERNAL_APPLE_ENABLED,
            EXTERNAL_APPLE_CLIENT_ID: model.EXTERNAL_APPLE_CLIENT_ID || undefined,
            EXTERNAL_APPLE_SECRET: model.EXTERNAL_APPLE_SECRET || undefined,
            EXTERNAL_AZURE_ENABLED: model.EXTERNAL_AZURE_ENABLED,
            EXTERNAL_AZURE_CLIENT_ID: model.EXTERNAL_AZURE_CLIENT_ID || undefined,
            EXTERNAL_AZURE_SECRET: model.EXTERNAL_AZURE_SECRET || undefined,
            EXTERNAL_AZURE_URL: model.EXTERNAL_AZURE_URL || undefined,
            EXTERNAL_BITBUCKET_ENABLED: model.EXTERNAL_BITBUCKET_ENABLED,
            EXTERNAL_BITBUCKET_CLIENT_ID: model.EXTERNAL_BITBUCKET_CLIENT_ID || undefined,
            EXTERNAL_BITBUCKET_SECRET: model.EXTERNAL_BITBUCKET_SECRET || undefined,
            EXTERNAL_DISCORD_ENABLED: model.EXTERNAL_DISCORD_ENABLED,
            EXTERNAL_DISCORD_CLIENT_ID: model.EXTERNAL_DISCORD_CLIENT_ID || undefined,
            EXTERNAL_DISCORD_SECRET: model.EXTERNAL_DISCORD_SECRET || undefined,
            EXTERNAL_FACEBOOK_ENABLED: model.EXTERNAL_FACEBOOK_ENABLED,
            EXTERNAL_FACEBOOK_CLIENT_ID: model.EXTERNAL_FACEBOOK_CLIENT_ID || undefined,
            EXTERNAL_FACEBOOK_SECRET: model.EXTERNAL_FACEBOOK_SECRET || undefined,
            EXTERNAL_GITHUB_ENABLED: model.EXTERNAL_GITHUB_ENABLED,
            EXTERNAL_GITHUB_CLIENT_ID: model.EXTERNAL_GITHUB_CLIENT_ID || undefined,
            EXTERNAL_GITHUB_SECRET: model.EXTERNAL_GITHUB_SECRET || undefined,
            EXTERNAL_GITLAB_ENABLED: model.EXTERNAL_GITLAB_ENABLED,
            EXTERNAL_GITLAB_CLIENT_ID: model.EXTERNAL_GITLAB_CLIENT_ID || undefined,
            EXTERNAL_GITLAB_SECRET: model.EXTERNAL_GITLAB_SECRET || undefined,
            EXTERNAL_GOOGLE_ENABLED: model.EXTERNAL_GOOGLE_ENABLED,
            EXTERNAL_GOOGLE_CLIENT_ID: model.EXTERNAL_GOOGLE_CLIENT_ID || undefined,
            EXTERNAL_GOOGLE_SECRET: model.EXTERNAL_GOOGLE_SECRET || undefined,
            EXTERNAL_LINKEDIN_ENABLED: model.EXTERNAL_LINKEDIN_ENABLED,
            EXTERNAL_LINKEDIN_CLIENT_ID: model.EXTERNAL_LINKEDIN_CLIENT_ID || undefined,
            EXTERNAL_LINKEDIN_SECRET: model.EXTERNAL_LINKEDIN_SECRET || undefined,
            EXTERNAL_NOTION_ENABLED: model.EXTERNAL_NOTION_ENABLED,
            EXTERNAL_NOTION_CLIENT_ID: model.EXTERNAL_NOTION_CLIENT_ID || undefined,
            EXTERNAL_NOTION_SECRET: model.EXTERNAL_NOTION_SECRET || undefined,
            EXTERNAL_TWITCH_ENABLED: model.EXTERNAL_TWITCH_ENABLED,
            EXTERNAL_TWITCH_CLIENT_ID: model.EXTERNAL_TWITCH_CLIENT_ID || undefined,
            EXTERNAL_TWITCH_SECRET: model.EXTERNAL_TWITCH_SECRET || undefined,
            EXTERNAL_TWITTER_ENABLED: model.EXTERNAL_TWITTER_ENABLED,
            EXTERNAL_TWITTER_CLIENT_ID: model.EXTERNAL_TWITTER_CLIENT_ID || undefined,
            EXTERNAL_TWITTER_SECRET: model.EXTERNAL_TWITTER_SECRET || undefined,
            EXTERNAL_SLACK_ENABLED: model.EXTERNAL_SLACK_ENABLED,
            EXTERNAL_SLACK_CLIENT_ID: model.EXTERNAL_SLACK_CLIENT_ID || undefined,
            EXTERNAL_SLACK_SECRET: model.EXTERNAL_SLACK_SECRET || undefined,
            EXTERNAL_SPOTIFY_ENABLED: model.EXTERNAL_SPOTIFY_ENABLED,
            EXTERNAL_SPOTIFY_CLIENT_ID: model.EXTERNAL_SPOTIFY_CLIENT_ID || undefined,
            EXTERNAL_SPOTIFY_SECRET: model.EXTERNAL_SPOTIFY_SECRET || undefined,
            EXTERNAL_ZOOM_ENABLED: model.EXTERNAL_ZOOM_ENABLED,
            EXTERNAL_ZOOM_CLIENT_ID: model.EXTERNAL_ZOOM_CLIENT_ID || undefined,
            EXTERNAL_ZOOM_SECRET: model.EXTERNAL_ZOOM_SECRET || undefined,
          }}
          onChangeModel={(model) => setExternalProvidersModel(model)}
          onReset={() => onFormReset()}
          onSubmit={(model: any) => onFormSubmit(model)}
        >
          <ToggleField
            name="EXTERNAL_APPLE_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_APPLE_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://developer.apple.com/account/resources/identifiers/add/bundleId"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_APPLE_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_APPLE_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_APPLE_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_AZURE_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_AZURE_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_AZURE_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_AZURE_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_AZURE_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
              <AutoField
                name="EXTERNAL_AZURE_URL"
                showInlineError
                errorMessage="Please enter the azure tenant url."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_BITBUCKET_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_BITBUCKET_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_BITBUCKET_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_BITBUCKET_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_BITBUCKET_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_DISCORD_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_DISCORD_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://discord.com/developers/applications#top"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_DISCORD_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_DISCORD_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_DISCORD_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_FACEBOOK_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_FACEBOOK_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_FACEBOOK_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_FACEBOOK_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_FACEBOOK_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_GITHUB_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_GITHUB_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://github.com/settings/applications/new"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_GITHUB_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_GITHUB_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_GITHUB_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_GITLAB_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_GITLAB_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://gitlab.com/oauth/applications"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_GITLAB_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_GITLAB_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_GITLAB_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_GOOGLE_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_GOOGLE_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://console.developers.google.com/apis/credentials"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_GOOGLE_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_GOOGLE_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_GOOGLE_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_LINKEDIN_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_LINKEDIN_ENABLED && (
                <a
                  className="pl-4 text-gray-400"
                  href="https://www.linkedin.com/developers/apps"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_LINKEDIN_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_LINKEDIN_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_LINKEDIN_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_NOTION_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_NOTION_ENABLED && (
                <a
                  className="pl-4 text-gray-400"
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_NOTION_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_NOTION_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_NOTION_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_TWITCH_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_TWITCH_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://dev.twitch.tv/console"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_TWITCH_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_TWITCH_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_TWITCH_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_TWITTER_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_TWITTER_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://developer.twitter.com/en/portal/dashboard"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_TWITTER_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_TWITTER_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_TWITTER_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_SLACK_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_SLACK_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://api.slack.com/apps"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_SLACK_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_SLACK_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_SLACK_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_SPOTIFY_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_SPOTIFY_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://developer.spotify.com/dashboard/"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_SPOTIFY_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_SPOTIFY_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_SPOTIFY_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
          <Divider light />
          <ToggleField
            name="EXTERNAL_ZOOM_ENABLED"
            addOns={
              externalProvidersModel.EXTERNAL_ZOOM_ENABLED && (
                <a
                  className="pl-4 text-scale-900"
                  href="https://developers.zoom.us/"
                  target="_blank"
                >
                  Create new credentials
                </a>
              )
            }
          />
          {externalProvidersModel.EXTERNAL_ZOOM_ENABLED && (
            <>
              <AutoField
                name="EXTERNAL_ZOOM_CLIENT_ID"
                showInlineError
                errorMessage="Please enter the client id."
              />
              <SecretField
                name="EXTERNAL_ZOOM_SECRET"
                showInlineError
                errorMessage="Please enter the secret."
              />
            </>
          )}
        </SchemaFormPanel>
      </div>

      <div className="my-8 mt-0">
        {config && (
          <AuditLog interval={config.isFreeTier ? '1 hour' : '7 days'} projectRef={projectRef} />
        )}
      </div>
    </div>
  )
}

const AuditLog = ({ interval, projectRef }: any) => {
  const { meta } = useStore()
  const [logs, setLogs] = useState<any>([])
  const [isLoading, setIsLoading] = useState<any>(false)

  const refreshLogs = async () => {
    setIsLoading(true)
    try {
      let query = `
        SELECT
            *
        FROM
            auth.audit_log_entries
        WHERE
            created_at > CURRENT_TIMESTAMP - interval '${interval}'
        ORDER BY
            created_at DESC
        LIMIT 1000;
      `
      const response = await meta.query(query)
      if (response.error) throw response.error
      setLogs(response)
    } catch (error) {
      console.error('Refresh logs error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshLogs()
  }, [])

  if (!logs.length) return <div></div>
  const cellCss = 'table-cell px-4 py-3 text-gray-200 font-mono text-xs'
  return (
    <Panel
      title={
        <div className=" w-full flex items-center justify-between">
          <Typography.Title level={5} className="flex-1 block">
            Audit Trail
          </Typography.Title>
          <div className="flex-1 text-right">
            <Button
              type="default"
              className="hover:border-gray-400"
              disabled={isLoading}
              loading={isLoading}
              onClick={() => refreshLogs()}
            >
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      <Table
        borderless
        head={
          <>
            <Table.th>Time</Table.th>
            <Table.th>Action</Table.th>
            <Table.th>User ID</Table.th>
            <Table.th>Identity</Table.th>
          </>
        }
        body={logs.map((x: any, i: number) => (
          <Table.tr key={x.id} className={`${i % 2 ? '' : 'bg-gray-500'}`}>
            <Table.td className={cellCss}>
              <Typography.Text>{x.payload.timestamp.replace('T', ' ')}</Typography.Text>
            </Table.td>
            <Table.td className={cellCss + ''}>
              <Typography.Text>{x.payload.action}</Typography.Text>
            </Table.td>
            <Table.td className={cellCss}>
              <Typography.Text>{x.payload.actor_id || x.payload.traits?.user_id}</Typography.Text>
            </Table.td>
            <Table.td className={cellCss}>
              <Typography.Text>
                {x.payload.actor_username || x.payload.traits?.user_email}
              </Typography.Text>
            </Table.td>
          </Table.tr>
        ))}
      />
    </Panel>
  )
}
