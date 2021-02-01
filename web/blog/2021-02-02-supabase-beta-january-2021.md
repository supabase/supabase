---
title: Supabase Beta January 2021
description: Eleven months of building.
author: Paul Copplestone
author_title: Supabase
author_url: https://github.com/kiwicopple
author_image_url: https://github.com/kiwicopple.png
authorURL: https://github.com/kiwicopple
image: /img/supabase-january-2021.png
tags: 
    - supabase
---

New year, new features. We've been busy at Supabase during January and our community has been even busier. Here's a few things you'll find interesting.

<!--truncate-->

### Quick demo

Watch a full demo:

<iframe className="w-full video-with-border" width="640" height="385" src="XXX" frameBorder="1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

### New Auth Providers

We enabled 2 new Auth providers - Facebook and Azure. Thanks to [@Levet](https://github.com/supabase/gotrue/pull/54) for the Azure plugin, and once again to [Netlify's amazing work](https://github.com/netlify/gotrue/issues/107) with GoTrue to implement Facebook.

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/14684256-be56-4ca6-8574-5631b8516b5b/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/14684256-be56-4ca6-8574-5631b8516b5b/Untitled.png)

### Auth UI widget

In case our Auth endpoints aren't easy enough already, we've built a React [Auth Widget](http://ui.supabase.com/?path=/story/auth-auth--default) for you to drop into your app and to get up-and-running in minutes. 

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/2884b32c-9f2b-43de-b359-cb2c8da6c0da/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/2884b32c-9f2b-43de-b359-cb2c8da6c0da/Untitled.png)

### Count functionality

Anyone who has worked with Firebase long enough has become frustrated over the [lack](https://stackoverflow.com/questions/49979714/how-to-get-count-of-documents-in-a-collection) of `count` functionality. This isn't a problem with PostgreSQL! Our libraries now have support for PostgREST's [exact](https://postgrest.org/en/v7.0.0/api.html?highlight=count#exact-count), [planned](https://postgrest.org/en/v7.0.0/api.html?highlight=count#planned-count), and [estimated](https://postgrest.org/en/v7.0.0/api.html?highlight=count#estimated-count) counts. A massive thanks to [@dshukertjr](https://github.com/supabase/postgrest-js/issues/94#event-4210564301) for this adding support to our client library.

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/7cf5c6b3-d658-4061-adc2-356ec69dd3df/carbon.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/7cf5c6b3-d658-4061-adc2-356ec69dd3df/carbon.png)

### Auth Audit Trail

We have exposed the audit trail directly in the dashboard, as well as the GoTrue logs. Great for debugging!

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/b0b1c97a-23c5-4ae0-8df9-466df7446139/auth.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/b0b1c97a-23c5-4ae0-8df9-466df7446139/auth.png)

### New `auth.email()` function

We added a helper function for extracting the logged in user's email address. 

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/4d363bc9-796c-4064-aa0b-f779a194d6fa/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/4d363bc9-796c-4064-aa0b-f779a194d6fa/Untitled.png)

### New Regions

Launch your database in London or Sydney!

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/c27d9790-1440-4e68-92c8-63ca02655201/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/c27d9790-1440-4e68-92c8-63ca02655201/Untitled.png)

### Copy rows as Markdown

You can now copy SQL results as Markdown - super useful for adding to blogs and issues!

- add GIF

### React server components

If you're excited by React Server components then check out the Supabase + Server Components experimental repo! [https://github.com/supabase/next-server-components](https://github.com/supabase/next-server-components)

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/16114265-978c-4288-980d-8cd8ff31e718/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/16114265-978c-4288-980d-8cd8ff31e718/Untitled.png)

### Learn

We know that Auth can be a bit daunting when you're just starting out, so we have created some intro videos to get you up to speed in no time:

- [Supabase Auth Deep Dive Part 1: JWTs](https://youtu.be/v3Exg5YpJvE)
- [Supabase Auth Deep Dive Part 2: Restrict Table Access](https://youtu.be/qY_iQ10IUhs)
- [Supabase Auth Deep Dive Part 3: User Based Access Policies](https://youtu.be/0LvCOlELs5U)

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/1979f502-c8f9-481d-ae09-edab71accfdf/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/1979f502-c8f9-481d-ae09-edab71accfdf/Untitled.png)

### Kaizen

- Performance: We migrated all of our subdomains to Route53, implementing custom Let's Encrypt certs for your APIs. As a result, our read benchmarks are measuring up 12% faster.
- Performance: We upgrade your databases to the new [GP3](https://aws.amazon.com/about-aws/whats-new/2020/12/introducing-new-amazon-ebs-general-purpose-volumes-gp3/) storage for faster and more consistent throughput.
- Bug fix: You're now able to disable custom SMTP: [https://github.com/supabase/infrastructure/issues/683](https://github.com/supabase/infrastructure/issues/683)

### Community

- Watch @leerob from Vercel deploy a full Next.js app with Supabase in just 2 minutes: 
[https://twitter.com/leeerob/status/1351576575888797696](https://twitter.com/leeerob/status/1351576575888797696)
- Redwood now supports Supabase:
[https://twitter.com/redwoodjs/status/1347311574415863811](https://twitter.com/redwoodjs/status/1347311574415863811)
- Deploy a full analytics solution using Umami: 
[https://twitter.com/mkalvas/status/1353880637506260994](https://twitter.com/mkalvas/status/1353880637506260994)
- Check out this open source Trello Clone:
[https://twitter.com/joshnuss/status/1352094804335857664](https://twitter.com/joshnuss/status/1352094804335857664)
- Get started with Expo + Supabase using this starter template from :
[https://twitter.com/kikiding/status/1352086899242856449](https://twitter.com/kikiding/status/1352086899242856449)
- Use Supabase Auth with NestJS: 
[https://twitter.com/atsuhio/status/1348516650144780288?s=21](https://twitter.com/atsuhio/status/1348516650144780288?s=21)
- The community has made some serious advances on the [Dart](https://github.com/supabase?q=dart&type=&language=), [C#](https://github.com/supabase?q=csharp&type=&language=), [Python](https://github.com/supabase?q=python&type=&language=), and [Kotlin](https://github.com/supabase?q=kotlin&type=&language=) libraries.


![This image shows GitHub star growth.](/img/blog/dec-starcount.png)

If you want to keep up to date, make sure you [subscribe to our YouTube channel](https://www.youtube.com/channel/UCNTVzV1InxHV-YR0fSajqPQ) or [follow us on Twitter](https://twitter.com/supabase_io).

### Coming next

We've go a lot of exciting things planned for Q1 2021. We're already planning out Supabase Storage and a Supabase CLI for better local development. Let us know if there's something you want us to release as a priority! 

We also have something exciting planned with Vercel and Stripe ... [stay tuned](https://twitter.com/rauchg/status/1331021818681978881).

### Get started

- Start using Supabase today: [app.supabase.io](https://app.supabase.io/)
- Make sure to [star us on GitHub](https://github.com/supabase/supabase)
- Follow us [on Twitter](https://twitter.com/supabase_io)
- Become a [sponsor](https://github.com/sponsors/supabase)