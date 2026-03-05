---
id: 'manage-usage-monthly-active-users-sso'
title: 'Manage Monthly Active SSO Users usage'
---

## What you are charged for

You are charged for the number of distinct users who log in or refresh their token during the billing cycle using a SAML 2.0 compatible identity provider (e.g. Google Workspace, Microsoft Active Directory). Each unique user is counted only once per billing cycle, regardless of how many times they authenticate. These users are referred to as "SSO MAUs".

### Example

Your billing cycle runs from January 1 to January 31. Although User-1 was signed in multiple times, they are counted as a single SSO MAU for this billing cycle.

<StepHikeCompact>
  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Sign User-1 in on January 3" fullWidth>
      The SSO MAU count increases from 0 to 1.

      ```javascript
      const { data, error } = await supabase.auth.signInWithSSO({
      domain: 'company.com'
    })

      if (data?.url) {
      // redirect User-1 to the identity provider's authentication flow
      window.location.href = data.url
    }
      ```
    </StepHikeCompact.Details>

  </StepHikeCompact.Step>

{' '}

<StepHikeCompact.Step step={2}>
  <StepHikeCompact.Details title="Sign User-1 out on January 4" fullWidth>
    ```javascript

    const { error } = await supabase.auth.signOut()

    ```

  </StepHikeCompact.Details>
</StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Sign User-1 in again on January 17" fullWidth>
      The SSO MAU count remains 1.

      ```javascript
      const { data, error } = await supabase.auth.signInWithSSO({
      domain: 'company.com'
    })

      if (data?.url) {
      // redirect User-1 to the identity provider's authentication flow
      window.location.href = data.url
    }
      ```
    </StepHikeCompact.Details>

  </StepHikeCompact.Step>
</StepHikeCompact>

## How charges are calculated

You are charged by SSO MAU.

### Usage on your invoice

Usage is shown as "Monthly Active SSO Users" on your invoice.

## Pricing

<$Partial path="billing/pricing/pricing_mau_sso.mdx" />

<Admonition type="note">

The count resets at the start of each billing cycle.

</Admonition>

| Plan       | Quota  | Over-Usage                          |
| ---------- | ------ | ----------------------------------- |
| Pro        | 50     | <Price price="0.015" /> per SSO MAU |
| Team       | 50     | <Price price="0.015" /> per SSO MAU |
| Enterprise | Custom | Custom                              |

## Billing examples

### Within quota

The organization's SSO MAU usage for the billing cycle is within the quota, so no charges apply.

| Line Item                | Units      | Costs                    |
| ------------------------ | ---------- | ------------------------ |
| Pro Plan                 | 1          | <Price price="25" />     |
| Compute Hours Micro      | 744 hours  | <Price price="10" />     |
| Monthly Active SSO Users | 37 SSO MAU | <Price price="0" />      |
| **Subtotal**             |            | **<Price price="35" />** |
| Compute Credits          |            | -<Price price="10" />    |
| **Total**                |            | **<Price price="25" />** |

### Exceeding quota

The organization's SSO MAU usage for the billing cycle exceeds the quota by 10, incurring charges for this additional usage.

| Line Item                | Units      | Costs                       |
| ------------------------ | ---------- | --------------------------- |
| Pro Plan                 | 1          | <Price price="25" />        |
| Compute Hours Micro      | 744 hours  | <Price price="10" />        |
| Monthly Active SSO Users | 60 SSO MAU | <Price price="0.15" />      |
| **Subtotal**             |            | **<Price price="35.15" />** |
| Compute Credits          |            | -<Price price="10" />       |
| **Total**                |            | **<Price price="25.15" />** |

## View usage

You can view Monthly Active SSO Users usage on the [organization's usage page](/dashboard/org/_/usage). The page shows the usage of all projects by default. To view the usage for a specific project, select it from the dropdown. You can also select a different time period.

<Image
  alt="Usage page navigation bar"
  src={{
    light: '/docs/img/guides/platform/usage-navbar--light.png',
    dark: '/docs/img/guides/platform/usage-navbar--dark.png',
  }}

width={1546}
height={208}
/>

In the Monthly Active SSO Users section, you can see the usage for the selected time period.

<Image
  alt="Usage page Monthly Active SSO Users section"
  src={{
    light: '/docs/img/guides/platform/usage-mau-sso--light.png',
    dark: '/docs/img/guides/platform/usage-mau-sso--dark.png',
  }}

width={2034}
height={884}
/>

## Exceeding Quotas

<$Partial path="billing/exceeding_usage_quotas.mdx" />
