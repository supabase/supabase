---
id: 'auth-web3'
title: 'Sign in with Web3'
subtitle: 'Use your Web3 wallet to authenticate users with Supabase'
---

[Enable Sign In with Web3](/dashboard/project/_/auth/providers) to allow users to sign in to your application using only their Web3 wallet.

Supported Web3 wallets:

- All Solana wallets
- All Ethereum wallets

## How does it work?

Sign in with Web3 utilizes the [EIP 4361](https://eips.ethereum.org/EIPS/eip-4361) standard to authenticate wallet addresses off-chain. This standard is widely supported by the Ethereum and Solana ecosystems, making it the best choice for verifying wallet ownership.

Authentication works by asking the Web3 wallet application to sign a predefined message with the user's wallet. This message is parsed both by the Web3 wallet application and Supabase Auth to verify its validity and purpose, before creating a user account or session.

An example of such a message is:

```
example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

I accept the ExampleOrg Terms of Service: https://example.com/tos

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Resources:
- https://example.com/my-web2-claim.json
```

It defines the wallet address, timestamp, browser location where the sign-in occurred and includes a customizable statement (`I accept...`) which you can use to ask consent from the user.

Most Web3 wallets are able to recognize these messages and show a dedicated "Confirm Sign In" dialog validating and presenting the information in the message in a secure and responsible way to the user. Even if the wallet does not directly support these messages, it will use the message signature dialog instead.

Finally the Supabase Auth server validates both the message's contents and signature before issuing a valid [User session](/docs/guides/auth/sessions) to your application. Validation rules include:

- Message structure validation
- Cryptographic signature verification
- Timestamp validation, ensuring the signature was created within 10 minutes of the sign-in call
- URI and Domain validation, ensuring these match your server's defined [Redirect URLs](/docs/guides/auth/redirect-urls)

The wallet address is used as the identity identifier, and in the identity data you can also find the statement and additional metadata.

## Enable the Web3 provider

In the dashboard navigate to your project's [Authentication Providers](/dashboard/project/_/auth/providers) section and enable the Web3 Wallet provider.

In the CLI add the following config to your `supabase/config.toml` file:

```toml
[auth.web3.solana]
enabled = true

[auth.web3.ethereum]
enabled = true
```

### Potential for abuse

User accounts that sign in with their Web3 wallet will not have an email address or phone number associated with them. This can open your project to abuse as creating a Web3 wallet account is free and easy to automate and difficult to correlate with a real person's identity.

Control your project's exposure by configuring in the dashboard:

- [Rate Limits for Web3](/dashboard/project/_/auth/rate-limits)
- [Enable CAPTCHA protection](/docs/guides/auth/auth-captcha)

Or in the CLI:

```toml
[auth.rate_limit]
# Number of Web3 logins that can be made in a 5 minute interval per IP address.
web3 = 30

[auth.captcha]
enabled = true
provider = "hcaptcha" # or other supported providers
secret = "0x0000000000000000000000000000000000000000"
```

Many wallet applications will warn the user if the message sent for signing is not coming from the page they are currently visiting. To further prevent your Supabase project from receiving signed messages destined for other applications, you must register your application's URL using the [Redirect URL settings](/docs/guides/auth/redirect-urls).

For example if the user is signing in to the page `https://example.com/sign-in` you should add the following configurations in the Redirect URL settings:

- `https://example.com/sign-in/` (last slash is important)
- Alternatively set up a glob pattern such as `https://example.com/**`

## Sign in with Ethereum

Ethereum defines the [`window.ethereum` global scope object](https://eips.ethereum.org/EIPS/eip-1193) that your app uses to interact with Ethereum Wallets. Additionally there is a [wallet discovery mechanism (EIP-6963)](https://eips.ethereum.org/EIPS/eip-6963) that your app can use to discover all of the available wallets on the user's browser.

To sign in a user with their Ethereum wallet make sure that the user has installed a wallet application. There are two ways to do this:

1. Detect the `window.ethereum` global scope object and ensure it's defined. This only works if your user has only one wallet installed on their browser.
2. Use the wallet discovery mechanism (EIP-6963) to ask the user to choose a wallet before they continue to sign in. Read [the MetaMask guide on the best way to support this](https://docs.metamask.io/wallet/tutorials/react-dapp-local-state).

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="window"
  queryGroup="ethWallet"
>

<TabPanel id="window" label="Ethereum Window API (EIP-1193)">

Use the following code to sign in a user, implicitly relying on the `window.ethereum` global scope wallet API:

```typescript
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: 'ethereum',
  statement: 'I accept the Terms of Service at https://example.com/tos',
})
```

</TabPanel>

<TabPanel id="wallet" label="Ethereum Wallet API (EIP-6963)">

Once you've obtained a wallet using the wallet detection (EIP-6963) mechanism, you can pass the selected wallet to the Supabase JavaScript SDK to continue the sign-in process.

```typescript
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: 'ethereum',
  statement: 'I accept the Terms of Service at https://example.com/tos',
  wallet: selectedWallet, // obtain this using the EIP-6963 mechanism
})
```

An excellent guide on using the [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) mechanism is available by [MetaMask](https://docs.metamask.io/wallet/tutorials/react-dapp-local-state).

</TabPanel>

<TabPanel id="custom" label="Ethereum Message and Signature">

If your application relies on a custom Ethereum wallet API, you can pass a [Sign in with Ethereum (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361) message and signature to complete the sign in process.

```typescript
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: 'ethereum',
  message: '<sign in with ethereum message>',
  signature: '<hex of the ethereum signature over the message>',
})
```

</TabPanel>

</Tabs>

## Sign in with Solana

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="window"
  queryGroup="solanaWallet"
>

<TabPanel id="window" label="Solana Window API">

Most Solana wallet applications expose their API via the `window.solana` global scope object in your web application.

Supabase's JavaScript Client Library provides built-in support for this API.

To sign in a user make sure that:

1. The user has installed a wallet application (by checking that the `window.solana` object is defined)
2. The wallet application is connected to your application by using the [`window.solana.connect()` API](https://docs.phantom.com/solana/establishing-a-connection)

Use the following code to authenticate a user:

```typescript
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: 'solana',
  statement: 'I accept the Terms of Service at https://example.com/tos',
})
```

Providing a `statement` is required for most Solana wallets and this message will be shown to the user on the consent dialog. It will also be added to the identity data for your users.

If you are using a non-standard Solana wallet that does not register the `window.solana` object, or your user has multiple Solana wallets attached to the page you can disambiguate by providing the wallet object like so:

- To use [Brave Wallet with Solana](https://wallet-docs.brave.com/solana):
  ```typescript
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'solana',
    statement: 'I accept the Terms of Service at https://example.com/tos',
    wallet: window.braveSolana,
  })
  ```
- To use [Phantom with Solana](https://docs.phantom.com/solana/detecting-the-provider):
  ```typescript
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'solana',
    statement: 'I accept the Terms of Service at https://example.com/tos',
    wallet: window.phantom,
  })
  ```

</TabPanel>

<TabPanel id="adapter" label="Solana Wallet Adapter">

Although the `window.solana` global scope JavaScript API is an unofficial standard, there still are subtle differences between wallet applications. The Solana ecosystem has provided the [Solana Wallet Adapter](https://solana.com/developers/courses/intro-to-solana/interact-with-wallets#solanas-wallet-adapter) system based on the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) to simplify ease of development.

The Supabase JavaScript Client Library supports signing in with this approach too. Follow the [Solana Interact with Wallets](https://solana.com/developers/courses/intro-to-solana/interact-with-wallets) guide on how to install and configure your application.

Below is a short example on using a `<SignInButton />` component that uses the `useWallet()` React hook to obtain the connected wallet and sign the user in with it:

```tsx
function SignInButton() {
  const wallet = useWallet()

  return (
    <>
      {wallet.connected ? (
        <button
          onClick={() => {
            supabase.auth.signInWithWeb3({
              chain: 'solana',
              statement: 'I accept the Terms of Service at https://example.com/tos',
              wallet,
            })
          }}
        >
          Sign in with Solana
        </button>
      ) : (
        <WalletMultiButton />
      )}
    </>
  )
}

function App() {
  const endpoint = clusterApiUrl('devnet')
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <SignInButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

</TabPanel>

</Tabs>

## Frequently asked questions

### How to associate an email address, phone number or social login to a user signing in with Web3?

Web3 wallets don't expose any identifying information about the user other than their wallet address (public key). This is why accounts that were created using Sign in with Web3 don't have any email address or phone number associated.

To associate an email address, phone number or other social login with their account you can use the `supabase.auth.updateUser()` or `supabase.auth.linkIdentity()` APIs.
