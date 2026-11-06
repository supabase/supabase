---
title: 'Navigating Regional Network Blocks'
description: 'A look at recent ISP and government-directed blocks of Supabase domains in three regions—what triggered them, how we worked with authorities and customers to restore access, and what multi-tenant platforms can do to prepare.'
author: sara_read
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=horizontal&copy=Navigating+Regional+Network+Blocks&icon=supabase.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=ruler&layout=icon-only&copy=Regional+network+blocks&icon=supabase.svg'
categories:
  - product
tags:
  - platform
  - reliability
date: '2026-03-26'
toc_depth: 2
---

If you provide infrastructure that hosts applications for developers, you will eventually run into network blocks. ISPs, national firewalls, and automated abuse systems can block IP ranges or domains with little warning. When you operate a multi-tenant platform, a single abusive workload can affect thousands of unrelated developers.

For infrastructure providers, this creates a difficult balance: you need to keep the platform open and flexible for developers while preventing behavior that can trigger regional blocks.

At Supabase, we’ve encountered this several times ourselves and in this post we share lessons from three real incidents, what caused them, and the steps we took to resolve and prevent them. In each case, local ISPs or government authorities had blocked access to `supabase.co` domains.

The goal is to help other infrastructure providers understand how these blocks happen and how to respond when they do.

## Mitigating blocks with the Public Suffix List

Multi-tenant platforms often host applications on subdomains like `project.example.com`. Without additional safeguards, browsers treat all of these as part of the same site, which can create security and reputation risks across tenants.

One mitigation is to add your hosting domain to the [**Public Suffix List**](https://github.com/publicsuffix/list), a community-maintained project hosted by the Mozilla Foundation.

Originally, Mozilla created this list so browsers could correctly enforce cookie boundaries across complex domain structures (e.g., co.uk). Over time it became the de facto standard used across the internet for determining domain ownership boundaries.

Adding your platform to this list is as simple as creating a Pull Request. You can find our example [here](https://github.com/publicsuffix/list/pull/1363). However, this is only a mitigation. Even though we submitted our suffix as far back as 2021, it hasn’t completely prevented network blocks in the past few years.

So why do these blocks happen at all?

## Why do countries and ISPs block domains?

Governments and ISPs around the world use domain blocking as a regulatory tool for a wide range of reasons. The most common include:

- **Copyright and broadcasting rights enforcement.** Authorities may direct ISPs to block platforms hosting content that violates local licensing agreements, such as unauthorized streaming.
- **Data protection and privacy violations.** Platforms that expose or mishandle the personal data of citizens can be blocked while regulators investigate or seek compliance.
- **National security and political control.** Some governments restrict access to services they view as threats to social stability or national security.
- **Anti-fraud and cybercrime enforcement.** Blocking is sometimes used as a rapid-response tool to shut down platforms linked to scams, phishing, or other criminal activity.

Blocking typically occurs at one of two layers. **DNS-level blocking** works by intercepting the domain name lookup process — when your device asks "where is supabase.co?", the ISP's DNS server returns no answer or a false one, making the domain appear unreachable. **IP blocking** goes deeper, dropping IP packets, which has the consequence of TCP connections timing out.

Both methods are blunt instruments. Because multi-tenant platforms like Supabase host thousands of independent projects under a single domain and a common set of IP addresses, a block targeting one bad actor can — and does — block every other project on the platform. Regulators often have no easy way to remove a single project; blocking the domain is the path of least resistance.

Cloudflare, our CDN provider and a key piece of internet infrastructure, is explicitly unable to intervene in government-directed blocking situations. When a government issues a blocking order, it falls on the platform operator — us — to engage with the relevant authority and work toward a resolution.

## Three recent examples of regional network blocks

In the last several months, Supabase handled three regional network blocks. Here is the background on what happened in each case.

### UAE — September 2025

Starting September 2, 2025, users in the UAE on the Etisalat and Du networks were unable to reach Supabase Projects. The UAE Telecommunications Regulatory Authority (TDRA) directed ISPs to block `*.supabase.co` because a single project hosted on our platform was being used to distribute unauthorized streaming content in violation of UAE broadcasting rights laws.

Supabase was not given advance notice. We had not received any formal abuse notification prior to the block going into effect.

We worked quickly to establish communication with the TDRA — assisted by a customer who helped broker the introduction — and we removed the offending project from our platform. Once we demonstrated compliance, TDRA lifted the restrictions. Etisalat was restored within days; Du followed shortly after. The block lasted approximately 18 days.

### Yemen — February 2026

Beginning February 2, 2026, users in Yemen on Yemen Mobile, Sabafon, Y-Telecom, and Spacetel lost access to Supabase Projects. Unlike the UAE, this block operated at the transport layer rather than at DNS — meaning TCP connections were being dropped before they could be established. No formal reason was ever communicated to us by YemenNet, the ISP issuing the block.

We opened a support ticket with Cloudflare, reached out to YemenNet directly via email, and worked to gather diagnostic data from affected customers. Despite these efforts, we received no response from the ISP through official channels. The block was ultimately resolved when a customer physically visited a YemenNet service center and requested the block be lifted. Access was restored on February 10, 2026 — approximately 8 days after the block began.

### India — February–March 2026

On February 24, 2026 Supabase experienced a temporary access restriction affecting the [supabase.co](https://supabase.com) domain for certain internet service providers in India. The restriction was imposed by the Ministry of Electronics and Information Technology (MeitY) under Section 69A of the Information Technology Act in connection with concerns relating to a third-party misuse of a Supabase-hosted project.

Supabase had previously received a notice from Indian authorities regarding that activity and responded immediately by disabling the relevant project and taking appropriate enforcement measures under our policies. Our review confirmed that the issue was limited to this single instance of platform misuse and did not involve any vulnerability or systemic issue with Supabase services.

Following constructive engagement with MeitY and the submission of additional technical information, the Government of India rescinded the blocking order and access to Supabase services in India was restored on March 3, 2026. The block lasted approximately 8 days.

Supabase appreciates the cooperation of the Indian authorities in resolving this matter. We have also established clearer and direct communication channels with the relevant agencies to ensure that any future concerns can be addressed quickly and precisely without disruption to developers and users.

## Workarounds we provided

During each incident, we worked to minimize disruption for affected users:

- **UAE:** We launched a proxy domain which restored access for PostgREST, Realtime, and Edge Functions, though auth callbacks and storage object URLs remained affected due to hardcoded domain references.
- **Yemen:** The transport-layer nature of the block limited what we could offer. VPN usage was the most reliable workaround available.
- **India:** We recommended VPNs, alternative DNS providers, and [custom domains](https://supabase.com/docs/guides/platform/custom-domains) as interim options while we worked toward a resolution.

In all three cases, VPN connections continued to work throughout the incidents. This is consistent with how DNS and transport-layer blocks generally work — they restrict access within a jurisdiction's network infrastructure, but encrypted tunnels routed through external servers bypass them entirely.

## What these incidents have in common

All three blocks share a pattern worth understanding:

1. A specific project on our platform violated local law or regulation — in two of the three cases, we had already taken the project down before authorities acted. Supabase takes legal compliance very seriously, and actively surveys and audits our platform to discover and eliminate violations of our use policies quickly.
2. We had no existing relationship with the relevant authorities, which slowed our ability to engage and resolve the situation quickly.
3. Customer relationships proved decisive — in the UAE, a customer introduced us to the TDRA; in Yemen, a customer resolved the issue in person with the ISP; in India, members of our team with local connections led the legal and government engagement.
4. Cloudflare, our CDN provider, is unable to intervene in government-directed blocking situations and advised that we engage the relevant authorities directly.

This pattern reflects a broader challenge for global developer platforms: regulatory enforcement is local, but the internet is not. When a government acts, it acts within its own jurisdiction — and the platform operator must meet it there.

## What steps can infrastructure providers take?

These incidents have made clear that operating a global developer platform means navigating a complex and sometimes unpredictable regulatory environment. Several steps that any provider can take include:

**Faster communication with regulators.** Work to establish direct, proactive relationships with telecommunications regulators and government agencies in key regions before incidents occur. Ensure it is easy for regulators and agencies to find contact emails to report abusive behavior and potential blocks. The goal is to be a known, compliant platform with clear channels for authorities to reach you, so that a blocking order is never the first contact.

**Better abuse response pipelines.** Improve handling of abuse response and communicate takedown actions so that when actions are taken on a project, relevant authorities are informed promptly, with acknowledgement from those parties confirmed as part of the process.

**Expanded workaround capabilities.** Evaluate technical options, including alternative domain infrastructure, to reduce the impact of regional blocks on users when they do occur.

## A note to our users in affected regions

We know how disruptive these incidents were. Developers and businesses depend on Supabase to run critical applications, and we take that responsibility seriously. We're sorry for the downtime and the uncertainty that came with it.

To every customer who helped us navigate these situations — including those who made introductions, provided diagnostic data, and in one case personally walked into an ISP office on our behalf — THANK YOU! Your support made a real difference.

If you ever encounter access issues in your region, please reach out to [support.supabase.com](https://support.supabase.com).

For details on each incident, you can find our status page history at [status.supabase.com](https://status.supabase.com).
