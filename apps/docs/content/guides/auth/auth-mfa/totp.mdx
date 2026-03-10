---
id: 'auth-mfa-totp'
title: 'Multi-Factor Authentication (TOTP)'
description: 'Add an additional layer of security to your apps with TOTP multi-factor authentication.'
---

## How does app authenticator multi-factor authentication work?

App Authenticator (TOTP) multi-factor authentication involves a timed one-time password generated from an authenticator app in the control of users. It uses a QR Code which to transmit a shared secret used to generate a One Time Password. A user can scan a QR code with their phone to capture a shared secret required for subsequent authentication.

The use of a QR code was [initially introduced by Google Authenticator](https://github.com/google/google-authenticator/wiki/Key-Uri-Format) but is now universally accepted by all authenticator apps. The QR code has an alternate representation in URI form following the `otpauth` scheme such as: `otpauth://totp/supabase:alice@supabase.com?secret=<secret>&issuer=supabase` which a user can manually input in cases where there is difficulty rendering a QR Code.

Below is a flow chart illustrating how the Enrollment, Challenge, and Verify APIs work in the context of MFA (TOTP).

<Image
  alt="Diagram showing the flow of Multi-Factor authentication"
  src={{
    light: '/docs/img/guides/auth-mfa/auth-mfa-flow.svg',
    dark: '/docs/img/guides/auth-mfa/auth-mfa-flow.svg',
  }}
  containerClassName="max-w-[700px]"
  width={111}
  height={150}
/>

[TOTP MFA API](/docs/reference/javascript/auth-mfa-api) is free to use and is enabled on all Supabase projects by default.

### Add enrollment flow

An enrollment flow provides a UI for users to set up additional authentication factors. Most applications add the enrollment flow in two places within their app:

1. Right after login or sign up.
   This lets users quickly set up MFA immediately after they log in or create an
   account. We recommend encouraging all users to set up MFA if that makes sense
   for your application. Many applications offer this as an opt-in step in an
   effort to reduce onboarding friction.
2. From within a settings page.
   Allows users to set up, disable or modify their MFA settings.

Enrolling a factor for use with MFA takes three steps:

1. Call `supabase.auth.mfa.enroll()`.
   This method returns a QR code and a secret. Display the QR
   code to the user and ask them to scan it with their authenticator application.
   If they are unable to scan the QR code, show the secret in plain text which
   they can type or paste into their authenticator app.
2. Calling the `supabase.auth.mfa.challenge()` API.
   This prepares Supabase Auth to accept a verification code from the user
   and returns a challenge ID. In the case of Phone MFA this step also sends the verification code to the user.
3. Calling the `supabase.auth.mfa.verify()` API.
   This verifies that the user has indeed added the secret from step (1) into
   their app and is working correctly. If the verification succeeds, the factor
   immediately becomes active for the user account. If not, you should repeat
   steps 2 and 3.

#### Example: React

Below is an example that creates a new `EnrollMFA` component that illustrates the important pieces of the MFA enrollment flow.

- When the component appears on screen, the `supabase.auth.mfa.enroll()` API is
  called once to start the process of enrolling a new factor for the current
  user.
- This API returns a QR code in the SVG format, which is shown on screen using
  a normal `<img>` tag by encoding the SVG as a data URL.
- Once the user has scanned the QR code with their authenticator app, they
  should enter the verification code within the `verifyCode` input field and
  click on `Enable`.
- A challenge is created using the `supabase.auth.mfa.challenge()` API and the
  code from the user is submitted for verification using the
  `supabase.auth.mfa.verify()` challenge.
- `onEnabled` is a callback that notifies the other components that enrollment
  has completed.
- `onCancelled` is a callback that notifies the other components that the user
  has clicked the `Cancel` button.

```tsx
/**
 * EnrollMFA shows a simple enrollment dialog. When shown on screen it calls
 * the `enroll` API. Each time a user clicks the Enable button it calls the
 * `challenge` and `verify` APIs to check if the code provided by the user is
 * valid.
 * When enrollment is successful, it calls `onEnrolled`. When the user clicks
 * Cancel the `onCancelled` callback is called.
 */
export function EnrollMFA({
  onEnrolled,
  onCancelled,
}: {
  onEnrolled: () => void
  onCancelled: () => void
}) {
  const [factorId, setFactorId] = useState('')
  const [qr, setQR] = useState('') // holds the QR code image SVG
  const [verifyCode, setVerifyCode] = useState('') // contains the code entered by the user
  const [error, setError] = useState('') // holds an error message

  const onEnableClicked = () => {
    setError('')
    ;(async () => {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) {
        setError(challenge.error.message)
        throw challenge.error
      }

      const challengeId = challenge.data.id

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      })
      if (verify.error) {
        setError(verify.error.message)
        throw verify.error
      }

      onEnrolled()
    })()
  }

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })
      if (error) {
        throw error
      }

      setFactorId(data.id)

      // Supabase Auth returns an SVG QR code which you can convert into a data
      // URL that you can place in an <img> tag.
      setQR(data.totp.qr_code)
    })()
  }, [])

  return (
    <>
      {error && <div className="error">{error}</div>}
      <img src={qr} />
      <input
        type="text"
        value={verifyCode}
        onChange={(e) => setVerifyCode(e.target.value.trim())}
      />
      <input type="button" value="Enable" onClick={onEnableClicked} />
      <input type="button" value="Cancel" onClick={onCancelled} />
    </>
  )
}
```

### Add a challenge step to login

Once a user has logged in via their first factor (email+password, magic link, one time password, social login etc.) you need to perform a check if any additional factors need to be verified.

This can be done by using the `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` API. When the user signs in and is redirected back to your app, you should call this method to extract the user's current and next authenticator assurance level (AAL).

Therefore if you receive a `currentLevel` which is `aal1` but a `nextLevel` of `aal2`, the user should be given the option to go through MFA.

Below is a table that explains the combined meaning.

| Current Level | Next Level | Meaning                                                  |
| ------------: | :--------- | :------------------------------------------------------- |
|        `aal1` | `aal1`     | User does not have MFA enrolled.                         |
|        `aal1` | `aal2`     | User has an MFA factor enrolled but has not verified it. |
|        `aal2` | `aal2`     | User has verified their MFA factor.                      |
|        `aal2` | `aal1`     | User has disabled their MFA factor. (Stale JWT.)         |

#### Example: React

Adding the challenge step to login depends heavily on the architecture of your app. However, a fairly common way to structure React apps is to have a large component (often named `App`) which contains most of the authenticated application logic.

This example will wrap this component with logic that will show an MFA challenge screen if necessary, before showing the full application. This is illustrated in the `AppWithMFA` example below.

```tsx
function AppWithMFA() {
  const [readyToShow, setReadyToShow] = useState(false)
  const [showMFAScreen, setShowMFAScreen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (error) {
          throw error
        }

        console.log(data)

        if (data.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel) {
          setShowMFAScreen(true)
        }
      } finally {
        setReadyToShow(true)
      }
    })()
  }, [])

  if (readyToShow) {
    if (showMFAScreen) {
      return <AuthMFA />
    }

    return <App />
  }

  return <></>
}
```

- `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` does return a promise.
  Don't worry, this is a very fast method (microseconds) as it rarely uses the
  network.
- `readyToShow` only makes sure the AAL check completes before showing any
  application UI to the user.
- If the current level can be upgraded to the next one, the MFA screen is
  shown.
- Once the challenge is successful, the `App` component is finally rendered on
  screen.

Below is the component that implements the challenge and verify logic.

```tsx
function AuthMFA() {
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')

  const onSubmitClicked = () => {
    setError('')
    ;(async () => {
      const factors = await supabase.auth.mfa.listFactors()
      if (factors.error) {
        throw factors.error
      }

      const totpFactor = factors.data.totp[0]

      if (!totpFactor) {
        throw new Error('No TOTP factors found!')
      }

      const factorId = totpFactor.id

      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) {
        setError(challenge.error.message)
        throw challenge.error
      }

      const challengeId = challenge.data.id

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      })
      if (verify.error) {
        setError(verify.error.message)
        throw verify.error
      }
    })()
  }

  return (
    <>
      <div>Please enter the code from your authenticator app.</div>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        value={verifyCode}
        onChange={(e) => setVerifyCode(e.target.value.trim())}
      />
      <input type="button" value="Submit" onClick={onSubmitClicked} />
    </>
  )
}
```

- You can extract the available MFA factors for the user by calling
  `supabase.auth.mfa.listFactors()`. Don't worry this method is also very quick
  and rarely uses the network.
- If `listFactors()` returns more than one factor (or of a different type) you
  should present the user with a choice. For simplicity this is not shown in
  the example.
- Each time the user presses the "Submit" button a new challenge is created for
  the chosen factor (in this case the first one) and it is immediately
  verified. Any errors are displayed to the user.
- On successful verification, the client library will refresh the session in
  the background automatically and finally call the `onSuccess` callback, which
  will show the authenticated `App` component on screen.

## Frequently asked questions

<Accordion
  type="default"
  openBehaviour="multiple"
  chevronAlign="right"
  justified
  size="medium"
  className="text-foreground-light mt-8 mb-6 [&>div]:space-y-4"
>

<AccordionItem
header={<span className="text-foreground">What's inside the QR code?</span>}
id="what-is-inside-the-qr-code"
>

</AccordionItem>

<AccordionItem
header={<span className="text-foreground">How long is the TOTP code valid for?</span>}
id="how-long-is-the-totp-code-valid-for"
>

In our TOTP implementation, each generated code remains valid for one interval, which spans 30 seconds. To account for minor time discrepancies, we allow for a one-interval clock skew. This ensures that users can successfully authenticate within this timeframe, even if there are slight variations in system clocks.

</AccordionItem>

</Accordion>
