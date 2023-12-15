# ai-commands

## Main purpose

This package contains all features involving OpenAI API. Technically, each feature is implemented as a function which
can be easily tested for regressions.

The streaming functions only work on Edge runtime so they can only be imported via a special `edge` subpath like so:

```
import { chatRlsPolicy } from 'ai-commands/edge'
```
