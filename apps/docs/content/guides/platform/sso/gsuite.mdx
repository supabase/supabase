---
title: 'Set Up SSO with Google Workspace'
description: 'Configure single sign-on with Google Workspace (G Suite).'
---

<Admonition type="note">

This feature is only available on the [Team and Enterprise Plans](/pricing). If you are an existing Team or Enterprise Plan customer, continue with the setup below.

</Admonition>

<Admonition type="tip">

Looking for docs on how to add Single Sign-On support in your Supabase project? Head on over to [Single Sign-On with SAML 2.0 for Projects](/docs/guides/auth/enterprise-sso/auth-sso-saml).

</Admonition>

Supabase supports single sign-on (SSO) using Google Workspace (formerly known as G Suite).

## Step 1: Open the Google Workspace web and mobile apps console [#google-workspace-console]

![Google Workspace: Web and mobile apps admin console](/docs/img/sso-gsuite-step-01.png)

## Step 2: Choose to add custom SAML app [#add-custom-saml-app]

From the _Add app_ button in the toolbar choose _Add custom SAML app_.

![Google Workspace: Web and mobile apps admin console, Add custom SAML app selected](/docs/img/sso-gsuite-step-02.png)

## Step 3: Fill out app details [#add-app-details]

The information you enter here is for visibility into your Google Workspace. You can choose any values you like. `Supabase` as a name works well for most use cases. Optionally enter a description.

![Google Workspace: Web and mobile apps admin console, Add custom SAML, App details screen](/docs/img/sso-gsuite-step-03.png)

## Step 4: Download IdP metadata [#download-idp-metadata]

This is a very important step. Click on _DOWNLOAD METADATA_ and save the file that was downloaded. You will need to upload this file later in [Step 10](#dashboard-configure-metadata).

![Google Workspace: Web and mobile apps admin console, Add custom SAML, Google Identity Provider details screen](/docs/img/sso-gsuite-step-04.png)

**Important: Make sure the certificate as shown on screen has at least 1 year before it expires. Mark down this date in your calendar so you will be reminded that you need to update the certificate without any downtime for your users.**

## Step 5: Add service provider details [#add-service-provider-details]

Fill out these service provider details on the next screen.

| Detail         | Value                                               |
| -------------- | --------------------------------------------------- |
| ACS URL        | `https://alt.supabase.io/auth/v1/sso/saml/acs`      |
| Entity ID      | `https://alt.supabase.io/auth/v1/sso/saml/metadata` |
| Start URL      | `https://supabase.com/dashboard`                    |
| Name ID format | PERSISTENT                                          |
| Name ID        | _Basic Information > Primary email_                 |

![Google Workspace: Web and mobile apps admin console, Add custom SAML, Service provider details screen](/docs/img/sso-gsuite-step-05.png)

## Step 6: Configure attribute mapping [#configure-attribute-mapping]

Attribute mappings allow Supabase to get information about your Google Workspace users on each login.

**A _Primary email_ to `email` mapping is required.** Other mappings shown below are optional and configurable depending on your Google Workspace setup. If in doubt, replicate the same config as shown.

Any changes you make from this screen will be used later in [Step 10: Configure Attribute Mapping](#dashboard-configure-attributes).

![Google Workspace: Web and mobile apps admin console, Add custom SAML, Attribute mapping](/docs/img/sso-gsuite-step-06.png)

## Step 7: Configure user access [#configure-user-access]

You can configure which Google Workspace user accounts will get access to Supabase. This is important if you wish to limit access to your software engineering teams.

You can configure this access by clicking on the _User access_ card (or down-arrow). Follow the instructions on screen.

![Google Workspace: Web and mobile apps admin console, Supabase app screen](/docs/img/sso-gsuite-step-08.png)

<Admonition type="note">

Changes from this step sometimes take a while to propagate across Google's systems. Wait at least 15 minutes before testing your changes.

</Admonition>

## Step 8: Enable SSO in the Dashboard [#dashboard-enable-sso]

1. Visit the [SSO tab](/dashboard/org/_/sso) under the Organization Settings page. ![SSO disabled](/docs/img/sso-dashboard-disabled.png)

2. Toggle **Enable Single Sign-On** to begin configuration. Once enabled, the configuration form appears. ![SSO enabled](/docs/img/sso-dashboard-enabled.png)

## Step 9: Configure domains [#dashboard-configure-domain]

Enter one or more domains associated with your users email addresses (e.g., `supabase.com`).
These domains determine which users are eligible to sign in via SSO.

![Domain configuration](/docs/img/sso-dashboard-configure-domain.png)

If your organization uses more than one email domain - for example, `supabase.com` for staff and `supabase.io` for contractors - you can add multiple domains here. All listed domains will be authorized for SSO sign-in.

![Domain configuration with multiple domains](/docs/img/sso-dashboard-configure-domain-multi.png)

<Admonition type="note">

We do not permit use of public domains like `gmail.com`, `yahoo.com`.

</Admonition>

## Step 10: Configure metadata [#dashboard-configure-metadata]

Upload the metadata file you downloaded in [Step 6](#download-idp-metadata) into the Metadata Upload File field.

![Metadata configuration with Google Workspace](/docs/img/sso-dashboard-configure-metadata-gsuite.png)

## Step 11: Configure attribute mapping [#dashboard-configure-attributes]

Enter the SAML attributes you filled out in [Step 6](#configure-attribute-mapping) into the Attribute Mapping section.

![Attribute mapping configuration](/docs/img/sso-dashboard-configure-attributes-generic.png)

<Admonition type="note">

If you did not customize your settings you may save some time by clicking the **G Suite** preset.

</Admonition>

## Step 12: Join organization on signup (optional) [#dashboard-configure-autojoin]

By default this setting is disabled, users logging in via SSO will not be added to your organization automatically.

![Auto-join disabled](/docs/img/sso-dashboard-configure-autojoin-disabled.png)

Toggle this on if you want SSO-authenticated users to be **automatically added to your organization** when they log in via SSO.

![Auto-join enable](/docs/img/sso-dashboard-configure-autojoin-enabled.png)

When auto-join is enabled, you can choose the **default role** for new users:

![Auto-join role selection](/docs/img/sso-dashboard-configure-autojoin-enabled-role.png)

Choose a role that fits the level of access you want to grant to new members.

<Admonition type="note">

Visit [access-control](/docs/guides/platform/access-control) documentation for details about each role.

</Admonition>

## Step 13: Save changes and test single sign-on [#dashboard-configure-save]

When you click **Save changes**, your new SSO configuration is applied immediately. From that moment, any user with an email address matching one of your configured domains who visits your organization's sign-in URL will be routed through the SSO flow.

We recommend asking a few users to test signing in via their Google Workspace account. They can do this by entering their email address on the [Sign in with SSO](/dashboard/sign-in-sso) page.

If SSO sign-in doesn't work as expected, contact your Supabase support representative for assistance.
