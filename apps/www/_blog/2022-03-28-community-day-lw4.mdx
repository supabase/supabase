---
title: 'Community Day'
description: Kicking off Launch Week 4 with contributors, partners, and friends.
author: thor_schaeff
author_url: https://github.com/thorwebdev
author_image_url: https://github.com/thorwebdev.png
imgSocial: launch-week-4/community-day/community-day-thumb.png
imgThumb: launch-week-4/community-day/community-day-thumb.png
categories:
  - developers
tags:
  - launch-week
  - community
date: '2022-03-28'
toc_depth: 3
video: https://www.youtube.com/v/aRgHKofrupU
---

Supabase combines existing open-source tools with our own open-source contributions to provide a delightful experience for all developers. As part of this, we’re building a community of communities, bringing together developers from many different backgrounds, as well as new developers looking to get involved with open source.

To kick off launch week, as it is now tradition, we’re showcasing some of the communities and contributors that make up the Supabase community, highlighting their awesome work, and celebrating everyone who contributes their time to the Supabase mission. 💚

## Launch Week 4 - what to expect

Supabase Launch Week was born out of [YC Demo Day](https://www.ycombinator.com/demoday), a looming deadline towards the end of each Y Combinator batch. A deadline that forces you to deliver a lot of complex functionality in a short amount of time.

With Launch Week, we replicate Demo Day conditions, but for a whole week! This is the secret formula that works for us:

- The Friday before, we publish a blog post about a topic of interest (e.g. [How we launch at Supabase](https://supabase.com/blog/supabase-how-we-launch), or this time around we [explore whether you should open source your company](https://supabase.com/blog/should-i-open-source-my-company) — hint: we think you most likely should!) as well as an [overview blogpost](https://supabase.com/blog/supabase-launch-week-four) with tons of memes and hints to what we’re shipping each day.
- Monday is Community Day, where we rally many of the awesome contributors and partners together and showcase awesome things around Supabase and open-source. This is also the time to watch out for the [#SupaLaunchWeek hashtag on Twitter](https://twitter.com/hashtag/SupaLaunchWeek?src=hashtag_click) as we arm our guest speakers, [Angels](https://supabase.com/blog/angels-of-supabase), and [SupaSquad](https://supabase.com/supasquad) with free swag codes.
- Tuesday, Wednesday, and Thursday are the big feature launches.
- Friday has become the feature kitchen sink, as we ship too many things to fit into one week. It’s our “One more thing(s)” day.
- And last but not least, coming out of Launch Week, we roll into a 10 day virtual hackathon with the community submitting tons of awesome projects to [madewithsupabase.com](https://www.madewithsupabase.com/), which, once upon a time, was a hackathon project itself. I know, quite the inception kinda stuff - so cool!

We repeat this roughly on a quarterly cadence, and I’ll tell ya, it becomes positively addictive. So strap in, and join us for a week of Fun(🕺).

## Supabase is now a GitHub secret scanning partner

![community-day-github.png](/images/blog/launch-week-4/community-day/community-day-github.png)

GitHub secret scanning protects users by searching repositories for known types of secrets. By identifying and flagging these secrets, GitHub’s scans help prevent data leaks and fraud.

[We have partnered with GitHub](https://github.blog/changelog/2022-03-28-supabase-is-now-a-github-secret-scanning-partner/) to scan for Supabase service role API keys, which allow full access to the database. If they detect any keys with `service_role` privileges being pushed to GitHub, they will forward the API key to us, so that we can automatically revoke the detected secrets and notify you - protecting your data against malicious actors.

## PostgREST 10 Pre-Release

![community-day-postgrest10.png](/images/blog/launch-week-4/community-day/community-day-postgrest10.png)

PostgREST v10 is not wrapped up yet, however a pre-release with the [latest features and fixes](https://postgrest.org/en/latest/releases/latest.html) is already available for Supabase users. v10 is mostly focused on improving availability and includes improvements to the API (and therefore [supabase-js](https://github.com/supabase/supabase-js)) too.

### Composite Types fields and Array Type elements

In prior versions, [computed columns](https://github.com/supabase/supabase/discussions/2825#discussioncomment-1167121) were required to access composite types fields or
array elements. This is no longer the case. You can now use the usual arrow operators (`->`) to do this. Assuming you have:

```sql
create type full_name as (
  first_name     text,
  middle_names   text[],
  first_surname  text,
  second_surname text,
  reign_name     text
);

create table famous_people (
  name full_name,
  occupation text
);
```

You can query for the `full_name` fields and just an element of its `middle_names` array with:

```jsx
const { data, error } = await supabase
  .from('users')
  .select(
    `
    name->first_name,
    name->middle_names->0,
    name->first_surname,
    occupation`
  )
  .eq('name->reign_name', 'Edward VIII')

console.log(data)
// {
//   "first_name": "Edward",
//   "middle_names": "Albert",
//   "first_surname": "David",
//   "occupation": "King of the United Kingdom"
// }
```

### Improved error messages

For better typing, PostgREST is committing to a standard form for all its errors. It follows the PostgreSQL format with the `message`, `detail`, `hint` and `code` fields, these will always show (with `null` as a default) in every error response. For more details you can check the [Errors page](https://postgrest.org/en/latest/errors.html).

### Improved availability

Linux's [EMFILE](https://blog.izs.me/2013/07/wtf-is-emfile-and-why-does-it-happen-to-me/) ("Too many open files") affected PostgREST when it was under heavy load,
sometimes making it unresponsive and in need of a manual restart. This is no longer the case and it will now recover from EMFILE.

Additionally, PostgREST now has [liveness and readiness checks](https://postgrest.org/en/latest/admin.html#health-check) which allows the Supabase infrastructure team to check its state to help it recover if necessary.

### Upcoming

When finished, PostgREST v10 will also include the ability to `limit` updates and deletes affected rows plus some other goodies for mutations.

## Auth updates

### New OAuth providers

![community-day-auth-providers.png](/images/blog/launch-week-4/community-day/community-day-auth-providers.png)

The beauty of open source is that anyone can contribute to make the project even better. This is especially true for supabase-auth as we get contributions and ideas for new oauth providers every month! This launch week, we’ve had 4 new OAuth provider contributions:

- [Keycloak](https://supabase.com/docs/guides/auth/social-login/auth-keycloak) ([@fspijkerman](https://github.com/fspijkerman))
- [Notion](https://supabase.com/docs/guides/auth/social-login/auth-notion) ([@zernonia](https://github.com/zernonia))
- [Zoom](https://supabase.com/docs/guides/auth/social-login/auth-zoom) ([@devkiran](https://github.com/devkiran))
- [WorkOS](https://supabase.com/docs/guides/auth/auth-workos) ([@bnjmnt4n](https://github.com/bnjmnt4n))

### New Phone providers

![community-day-auth-phone.png](/images/blog/launch-week-4/community-day/community-day-auth-phone.png)

We’ve also added 2 new phone providers from the same contributor:

- [Vonage](https://supabase.com/docs/guides/auth/phone-login/vonage) ([@devkiran](https://github.com/devkiran))
- [TextLocal](https://github.com/supabase/gotrue/pull/342) ([@devkiran](https://github.com/devkiran))

If you haven’t tried out phone auth yet, check out [this blog post](https://supabase.com/blog/supabase-auth-passwordless-sms-login) to get started!

### Send OTP via Email

We’ve added support for sending an OTP via email instead of url links. All you have to do is to add `{{ .Token }}` in your email templates. You can use the `verifyOTP` method to verify the otp sent.

![Untitled](/images/blog/launch-week-4/community-day/Untitled.png)

### Server-side auth for Next.js and Nuxt (SvelteKit and Remix coming soon)

![supabase-auth-helpers-nextjs.png](/images/blog/launch-week-4/community-day/supabase-auth-helpers-nextjs.png)

While server-side auth has always been possible, we’ve heard from many of you that auth can be tough, especially when doing server-side rendering (SSR) or using the new Next.js middleware capabilities.

That’s why we’ve built the [supabase-auth-helpers](https://github.com/supabase-community/supabase-auth-helpers), a collection of framework-specific auth utilities that make working with Supabase Auth a pleasant experience, no matter what framework you’re using.

We’ve started with Next.js, and we’re working on helpers for Remix, and SvelteKit, so make sure to star and watch the repo!

We’ve also worked with our friends at Vercel to update our https://github.com/vercel/nextjs-subscription-payments example to use the new auth helpers.

In parallel, our friends at [NuxtLabs](https://nuxtlabs.com/) have developed [Supabase helpers for Nuxt 3](https://github.com/nuxt-community/supabase-module), and it’s a damn nice DX. [Check it out](https://supabase.nuxtjs.org/)!

As always, all of this is open-source. Feedback, feature requests, and contributions are very welcome!

## Open Source Spotlight: Charm.sh

[Charm.sh](http://Charm.sh) builds open-source tools that make the command line glamorous. If you use the [Supabase CLI](https://supabase.com/docs/reference/cli/about) you’ve probably come across some of their features already, and we plan to utilise more of them in the future to improve our CLI experience further.

For our community day open source spotlight feature, we’re delighted to have [Bashbunni](https://twitter.com/bash_bunni) give us an overview of what’s possible with Charm:

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/aRgHKofrupU"
    frameBorder="0"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>

## New courses and learning materials

### Ionic Quickstart Guides

![community-day-iconic.png](/images/blog/launch-week-4/community-day/community-day-iconic.png)

The awesome folks at [Ionic](https://twitter.com/Ionicframework) have put together some quickstart guides for [Angular](https://supabase.com/docs/guides/with-ionic-angular), [React](https://supabase.com/docs/guides/with-ionic-react), and [Vue](https://supabase.com/docs/guides/with-ionic-vue). These guides walk you through building an app which allows users to login and update some basic profile details.

### Everything Svelte

![Untitled](/images/blog/launch-week-4/community-day/Untitled%201.png)

From the good folks at Everything Svelte, this course teaches you everything you need to know to build to a custom full stack web application. They start from scratch (no starter files!) then take it one step at a time, building the frontend *and* backend. This course explores topics like authentication, accepting payments, relational databases, testing, and automatic deployment.

Head over to [everythingsvelte.com](https://www.everythingsvelte.com/) and sign up to get notified when the course launches later in spring!

### Level Up Tutorials

![community-day-level-up.png](/images/blog/launch-week-4/community-day/community-day-level-up.png)

Excited to see what all the fuss is about with this new framework called Remix? Played with Remix and wanna go deeper integrating Supabase? We’ve got you covered! Jon has been working with Scott Tolinski over at [Level Up Tutorials](https://leveluptutorials.com/) to create the perfect guide for building a fullstack, authenticated, realtime application using Remix and Supabase.

This goes much deeper than your basic “hello world” or “todo: app, showing how to use loaders and actions in Remix to synchronize complex state between multiple clients. The course uses Row Level Security to implement access policies within the database, and shows how cookies can be used to query Supabase from the server-side.

Join us for the [official course drop party on YouTube](https://www.youtube.com/watch?v=rntEMgaenHs) where we will be doing a Q&A about Supabase, Remix and what will be covered in the course.

Can’t make the event? Chuck your name on the [mailing list](https://jonmeyers.io/subscribe/remix) and we’ll let you know when the course is live (and maybe even send out some exclusive discounts! 🤫)

### Egghead tutorials featuring SupaSquad

![community-day-egghead.png](/images/blog/launch-week-4/community-day/community-day-egghead.png)

After a flood of positive feedback on Jon’s “[Build a SaaS product with Next.js, Supabase and Stripe](https://egghead.io/courses/build-a-saas-product-with-next-js-supabase-and-stripe-61f2bc20)” [Egghead.io](http://Egghead.io) course, we’re doubling down with Egghead this year, partnering with them to build more tailored pathways for learning Supabase.

We’ll be working with our fabulous [SupaSquad](https://supabase.com/supasquad) to identify the right instructors for all the different topics we’re looking to cover. If you’re interested in becoming an instructor for Supabase on Egghead, fill in the [form to join](https://supabase.com/supasquad#how-to-join) the SupaSquad.

Also, do let us know what topics you’d like to learn about [on Twitter](https://twitter.com/supabase).

## Launching the Supabase Partner Gallery

![community-day-integrations.png](/images/blog/launch-week-4/community-day/community-day-integrations.png)

We’ve been blown away by the amazing integrations that developers and companies have been building on top of Supabase. To keep track of all the things that work with Supabase, we’re launching a partner gallery which allows you to browse integrations and experts. Check it out at [supabase.com/partners](https://supabase.com/partners).

If you’ve built an integration that works with Supabase or have experience working with Supabase and want to offer your services to others, we’d love to hear from you: [supabase.com/partners/#become-a-partner](https://supabase.com/partners/#become-a-partner)

Of course the code for our partner gallery is also open source, and we’ve even split it out into a separate example repository which is a neat showcase of how to use [Postgres Full Text Search](https://supabase.com/docs/guides/database/full-text-search). It’s super powerful, it’s like a search engine within Postgres!

## Hackathon

On Friday, 1st of April, at the end of Launch Week, we’ll be rolling into another one of our 10-day virtual Hackathons. As always, you’ll have the chance to win extremely limited Supabase Swag, and you’ll be able to play around with the new features we’re about to launch.

We’re extremely excited to see what you’ll build and can’t wait to dive into your submissions on [madewithsupabase.com](https://www.madewithsupabase.com/).

We’re also delighted to be partnering with [the Future Forest Company](https://thefutureforestcompany.com/) to plant a tree for every project that is being submitted for the Hackathon. Let’s build some cool open-source projects and start a forest at the same time!

## Let’s get launching 🚀

And with that, we officially declare Launch Week as open! Check back [here](/blog/supabase-launch-week-four) every day this week to see what new things we are shipping. We can't wait to share them with you!
