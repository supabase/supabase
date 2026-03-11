---
title: 'Set Up SSO with Azure AD'
description: 'Configure single sign-on with Azure AD (Microsoft Entra).'
---

<Admonition type="note">

This feature is only available on the [Team and Enterprise Plans](/pricing). If you are an existing Team or Enterprise Plan customer, continue with the setup below.

</Admonition>

<Admonition type="tip">

Looking for docs on how to add Single Sign-On support in your Supabase project? Head on over to [Single Sign-On with SAML 2.0 for Projects](/docs/guides/auth/enterprise-sso/auth-sso-saml).

</Admonition>

Supabase supports single sign-on (SSO) using Microsoft Azure AD.

## Step 1: Add and register an Enterprise application [#add-and-register-enterprise-application]

Open up the [Azure Active Directory](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview) dashboard for your Azure account.

Click the _Add_ button then _Enterprise application_.

![Azure AD console: Default Directory Overview](/docs/img/sso-azure-step-01.png)

## Step 2: Choose to create your own application [#create-application]

You'll be using the custom enterprise application setup for Supabase.

![Azure AD console: Browse Azure AD Gallery, select: Create your own application](/docs/img/sso-azure-step-02.png)

## Step 3: Fill in application details [#add-application-details]

In the modal titled _Create your own application_, enter a display name for Supabase. This is the name your Azure AD users will see when signing in to Supabase from Azure. `Supabase` works in most cases.

Make sure to choose the third option: _Integrate any other application you
don't find in the gallery (Non-gallery)_.

![Azure AD console: Create your own application modal](/docs/img/sso-azure-step-03.png)

## Step 4: Set up single sign-on [#set-up-single-sign-on]

Before you get to assigning users and groups, which would allow accounts in Azure AD to access Supabase, you need to configure the SAML details that allows Supabase to accept sign in requests from Azure AD.

![Azure AD console: Supabase custom enterprise application, selected Set up single sign-on](/docs/img/sso-azure-step-04.png)

## Step 5: Select SAML single sign-on method [#saml-sso]

Supabase only supports the SAML 2.0 protocol for Single Sign-On, which is an industry standard.

![Azure AD console: Supabase application, Single sign-on configuration screen, selected SAML](/docs/img/sso-azure-step-05.png)

## Step 6: Upload SAML-based sign-on metadata file [#upload-saml-metadata]

First you need to download Supabase's SAML metadata file. Click the button below to initiate a download of the file.

    <a href="https://alt.supabase.io/auth/v1/sso/saml/metadata?download=true">
      <Button size="large" icon={<IconArrowDown />}>
        Download Supabase SAML Metadata File
      </Button>
    </a>

Alternatively, visit this page to initiate a download: `https://alt.supabase.io/auth/v1/sso/saml/metadata?download=true`

Click on the _Upload metadata file_ option in the toolbar and select the file you just downloaded.

![Azure AD console: Supabase application, SAML-based Sign-on screen, selected Upload metadata file button](/docs/img/sso-azure-step-06-1.png)

All of the correct information should automatically populate the _Basic SAML Configuration_ screen as shown.

![Azure AD console: Supabase application, SAML-based Sign-on screen, Basic SAML Configuration shown](/docs/img/sso-azure-step-06-2.png)

**Make sure you input these additional settings.**

| Setting     | Value                                        |
| ----------- | -------------------------------------------- |
| Sign on URL | `https://supabase.com/dashboard/sign-in-sso` |
| Relay State | `https://supabase.com/dashboard`             |

Finally, click the _Save_ button to save the configuration.

## Step 7: Obtain metadata URL [#idp-metadata-url]

Save the link under **App Federation Metadata URL** in \*section 3 **SAML Certificates\***. You will need to enter this URL later in [Step 10](#dashboard-configure-metadata).

![Azure AD console: Supabase application, SAML Certificates card shown, App Federation Metadata Url highlighted](/docs/img/sso-azure-step-07.png)

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

Enter the metadata URL you obtained from [Step 7](#idp-metadata-url) into the Metadata URL field:

![Metadata configuration with Azure AD](/docs/img/sso-dashboard-configure-metadata-azure.png)

## Step 11: Configure attribute mapping [#dashboard-configure-attributes]

Fill out the Attribute Mapping section using the **Azure** preset.

![Attribute mapping configuration](/docs/img/sso-dashboard-configure-attributes-azure.png)

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

We recommend asking a few users to test signing in via their Azure AD account. They can do this by entering their email address on the [Sign in with SSO](/dashboard/sign-in-sso) page.

If SSO sign-in doesn't work as expected, contact your Supabase support representative for assistance.
