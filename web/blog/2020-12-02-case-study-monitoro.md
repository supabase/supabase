---
title: A web crawler handling millions of API requests
description: See how Monitoro built an automated scraping platform using Supabase.
author: Rory Wilding
author_title: Supabase
author_url: https://github.com/roryw10
author_image_url: https://github.com/roryw10.png
authorURL: https://github.com/roryw10
# image: /img/supabase-november-2020.png
tags: 
    - case-study
    - nocode
---

Omar Kamali is the founder of [Monitoro](https://www.monitoro.xyz/), a service for scraping countless websites 24/7 to notify customers when these websites change. To create this product, Omar needed to handle massive data throughput whilst ensuring his product was reliable and resilient to satisfy a rapidly growing user base.

<!--truncate-->

### The Story of the individual

Omar spent time doing customer discovery and building out a version 1. After getting some initial feedback and spending time learning from his customers he realised in order to build out the functionality they wanted, he would need real-time functionality. 

From experience, Omar understood from day one that using a technology such as Firebase would have been unthinkable. He wanted to avoid vendor lock-in as well as leverage PostgreSQL's large ecosystem of tools in other parts of his processes. He didn't want to spend time setting up MongoDB, and whilst Hasura seemed like a possibility, it was over-engineered for his use case. 

Omar saw Supabase mentioned on Hacker News and realised immediately it had the potential to solve his problems and let him launch version 2 of Monitoro with the real-time functionality his users would value, without sacrificing moving fast.  

***Photo here?***

Within a couple of days, Omar had a version ready he could deploy. Fast forward to today and his user base has been ramping up, as they use Monitoro to monitor changes to websites all over the world. With how fast his user base has grown Omar has peace of mind through his decision to use Supabase, knowing it will just work and he doesn't need to worry about DevOps.  

> *"Supabase was the exactly the solution I needed so when I saw it on Hacker News I was instantly excited. Supabase allowed us to go further, faster, with our product functionality. We had a fast-growing user base which would have been challenging to support without being able to depend on Supabase." *
> 
> <small>Omar Kamali, Monitoro Founder</small>

### Prototype fast, and keep going

Thanks to Supabase, Omar could deliver the features he needed faster than he anticipated. This has allowed him to spend more time focusing on speaking to customers and marketing - as a result, his user base has grown massively in a short space of time. Thanks to Supabase there was no need to worry about how to create a database which had real-time functionality could scale and could be set up quickly. Omar could focus on launching fast.