---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  actions:
    - theme: alt
      text: Visit docs
      link: /docs/
---

# Overview

This documentation contains the types for telemetry-related events.

## Tags
All events have some tags defined to simplify the understanding of where and how things are going. The tags are as following:

### `@source`
Which application the event is sent from. The options are:
```
client-side, www
client-side, studio
client-side, docs
server-side
```