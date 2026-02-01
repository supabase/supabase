---
title: 'Supabase Auth: Bring-your-own Auth0, Cognito, or Firebase'
description: 'Use Firebase Auth, Auth0 or AWS Cognito (Amplify) with your Supabase project, secure your users with SMS based MFA, and use send hooks.'
author: stojan
imgSocial: lw12/third-party-auth/og.png
imgThumb: lw12/third-party-auth/thumb.png
launchweek: '12'
categories:
  - launch-week
tags:
  - auth
  - engineering
date: '2024-08-14'
toc_depth: 2
---

Today we have 3 new announcements for Supabase Auth:

1. Support for third-party Auth providers
2. Phone-based Multi-factor Authentication (SMS and Whatsapp)
3. New Auth Hooks for SMS and email

Let's dive into each new feature.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/BPD7kxb5N84"
    title="Supabase Auth: Bring-your-own Auth0, Cognito, or Firebase"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

## Support for third-party Auth providers

The headline feature today is [third-party Authentication](https://supabase.com/docs/guides/auth/third-party/overview).

![Third-party auth](/images/blog/lw12/third-party-auth/third-party-auth.png)

Supabase is a modular platform. We've been designing it so that you can choose which products you use with Postgres. You can use our own products (like Supabase Auth) or external products (like Auth0), and _in theory_ the experience should be just-as-delightful.

Until today, using third-party auth products required developers to translate JWTs into a format compatible with Supabase Auth. This is difficult and unmaintainable.

So we fixed it. Today we're adding first-class support for the following third-party authentication products:

1. [Auth0](https://supabase.com/docs/guides/auth/third-party/firebase-auth)
2. [AWS Cognito](https://supabase.com/docs/guides/auth/third-party/aws-cognito) (standalone or via AWS Amplify)
3. [Firebase Auth](https://supabase.com/docs/guides/auth/third-party/firebase-auth)

<Admonition>

Firebase Auth is currently under a private-alpha release stage, as we're still improving the security developer experience when using it. [Register your interest](https://forms.supabase.com/third-party-auth-with-firebase) and someone from the team will reach out.

</Admonition>

Migrating auth providers can be costly and technically challenging, especially for applications with large user bases. You can use Supabase's native auth offering alongside your third-party authentication provider to achieve a disruption-free migration.

All of the third-party providers are supported in the Supabase CLI, so you can evaluate, test, and develop your integration for free.

The Supabase client supports third-party auth like this:

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => {
    const accessToken = await auth0.getTokenSilently()
    return accessToken
  },
})
```

## Phone-based multi-factor authentication

We've extended MFA to [support SMS and WhatsApp](https://supabase.com/docs/guides/auth/auth-mfa).

![Phone MFA](/images/blog/lw12/third-party-auth/phone-mfa.png)

We have a strong conviction that all applications should have access to an open and secure authentication provider. Secure-by-default should not be a luxury: developers should have affordable access to security best-practices.

[Almost two years ago](https://supabase.com/blog/mfa-auth-via-rls) we launched [MFA with TOTP (app authenticator)](https://supabase.com/docs/guides/auth/auth-mfa) free of charge. Since then, we've heard a common complaint from developers: app authenticators can be hard to adopt for non-techies. Phone-based MFA is for those developers who want to provide a more accessible MFA experience for their users.

<Admonition>

No security product is infallible! MFA with SMS can come with some hidden security drawbacks - please evaluate your application's risk tolerance for SIM-swapping attacks.

</Admonition>

The code looks like this:

{/* prettier-ignore */}
```ts
// Send an SMS or WhatsApp message to the user
const { data: { challengeId } } = await supabase.auth.mfa.challenge({
  factorId,
})

// To verify the code received by the user
await supabase.auth.mfa.verify({
  factorId,
  challengeId,
  code: '123456',
})

// The user's `aal` claim in the JWT 
// will be upgraded to aal2
```

## Auth Hooks for SMS and Email

We've added a few new [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks), which supports HTTP endpoints as a webhook now.

**Email Hooks**

We've heard the (rather loud) feedback that the built-in email templates (based on the Go templating language) can be limiting. There's been a lot of development in email rendering libraries like [Resend's React Email](https://resend.com/blog/react-email-2). To help make this available for developers, we've added a ["Send Email" Auth Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), which you can use to customize your emails and how they are sent.

**SMS Hooks**

Supabase Auth has built-in support for popular SMS sending providers like Twilio, Messagebird, Textlocal and Vonage, but we realize this choice can be limiting.

Today we're launching a new ["Send SMS" Auth Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook). You no longer need to use the built-in provider - you can implement your own by specifying a HTTP endpoint that receives a POST request when a message needs to be sent.

## Getting started

Check out the docs for more details on how to get started:

- [Third-party Authentication](https://supabase.com/docs/guides/auth/third-party/overview)
- [Multi-factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa)
- [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
