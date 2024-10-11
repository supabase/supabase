# Overview

This documentation contains the types for telemetry-related events.

## Naming conventions
Some conventions to keep in mind when creating / reviewing events
- Event names are snake_case
- We follow a [object]_[verb] structure to create self-explanatory events
- We aim to use regular past tense verbs
- We aim to re-use verbs such as
    - clicked
    - submitted
    - created
    - removed
    - updated
- Custom event properties are camelCase
- Custom event propertties should be self-explanatory
    - We want to rather be more specific than less, for example `productType` vs `buttonLabel`
- User / organization / project properties are camelCase

## Instructions for creating new events

TBD.

### `@sources`
Which application the event is sent from. The options are
```
client-side, www
client-side, studio
client-side, docs
server-side
```

